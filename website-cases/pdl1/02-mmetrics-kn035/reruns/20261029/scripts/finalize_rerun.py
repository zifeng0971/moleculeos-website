#!/usr/bin/env python3
"""Finalize this independent native-MMetrics rerun archive; no network or MOS calls.

Run only after collection, for example:
  python3 scripts/finalize_rerun.py --record raw/export/record.json --zip

input.json records project_id and the unchanged source structure. results.json
records tasks or native_tasks, each with task_id, status, and optional stage/name
and source_file. One combined native pipeline task is valid; no historical task
count or stage layout is assumed. --task-status can supply additional task JSON.
Homologs may be empty: their observed count is checked, never invented.
"""
from pathlib import Path
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import argparse
import hashlib
import json
import sys
import zipfile


RUN = Path(__file__).resolve().parents[1]
CASE = RUN.parents[1]
MASTER = CASE.parent / '01-structure/raw/MMFold_1.cif'
EXPECTED_SHA256 = 'd32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317'
ORIGINAL_TASK_IDS = {'342604299285504', '342604577018880'}
SUCCESS = {'success', 'succeed', 'succeeded', 'completed', 'finished'}
FAILURE = {'failed', 'failure', 'error', 'cancelled', 'canceled', 'aborted'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(path):
    def reject_constant(value):
        raise ValueError(f'Non-finite JSON number: {value}')
    return json.loads(path.read_text(), parse_constant=reject_constant)


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + '\n')


def local_path(value):
    path = Path(value)
    return path if path.is_absolute() else RUN / path


def task_rows(document):
    if isinstance(document, list):
        return [row for row in document if isinstance(row, dict)]
    if not isinstance(document, dict):
        return []
    rows = []
    for key in ['tasks', 'native_tasks', 'task_statuses']:
        if isinstance(document.get(key), list):
            rows.extend(task_rows(document[key]))
    if 'task_id' in document and 'status' in document:
        rows.append(document)
    return rows


def homolog_rows(document):
    if isinstance(document, list):
        return document
    if isinstance(document, dict):
        for key in ['data', 'items', 'rows', 'raw']:
            if isinstance(document.get(key), list):
                return document[key]
        if isinstance(document.get('annotations'), dict):
            return document['annotations'].get('homology')
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input-structure', default=str(MASTER))
    parser.add_argument('--imported-structure', help='Downloaded new MOS object, if available')
    parser.add_argument('--record', help='Current native record.json, relative to this run')
    parser.add_argument('--homologs', help='Optional extracted homolog JSON to compare with record')
    parser.add_argument('--expected-homolog-count', type=int)
    parser.add_argument('--task-status', action='append', default=[], help='Additional task-status JSON')
    parser.add_argument('--project-id', default='345488380847104')
    parser.add_argument('--allow-missing-record', action='store_true', help='Document unavailable record as a scope limit')
    parser.add_argument('--zip', nargs='?', const='', metavar='OUTPUT', help='ZIP this run; default is adjacent to run folder')
    args = parser.parse_args()
    failures, incomplete, limits, checks = [], [], [], {}
    documents = {}

    for name in ['input.json', 'results.json']:
        path = RUN / name
        if not path.is_file():
            incomplete.append(f'Missing {name}')
            continue
        try:
            documents[name] = read_json(path)
        except (ValueError, OSError) as error:
            failures.append(f'{name}: {error}')
    original_prompt = CASE / 'raw/submitted-prompt.txt'
    prompt = RUN / 'submitted-prompt.txt'
    if prompt.is_file() and original_prompt.is_file():
        checks['prompt_byte_identical_to_original'] = prompt.read_bytes() == original_prompt.read_bytes()
        checks['prompt_sha256'] = sha(prompt)
        checks['original_prompt_sha256'] = sha(original_prompt)
        if not checks['prompt_byte_identical_to_original']:
            failures.append('Submitted prompt differs from original prompt')
    else:
        incomplete.append('Submitted or original prompt unavailable')
    structure = local_path(args.input_structure)
    if structure.is_file():
        checks['input_structure'] = str(structure)
        checks['input_structure_sha256'] = sha(structure)
        checks['input_structure_matches_master'] = sha(structure) == EXPECTED_SHA256
        if not checks['input_structure_matches_master']:
            failures.append('Input structure does not match unchanged master SHA256')
    else:
        incomplete.append(f'Input structure unavailable: {structure}')
    if args.imported_structure:
        imported = local_path(args.imported_structure)
        if imported.is_file():
            checks['imported_structure_sha256'] = sha(imported)
            checks['imported_structure_matches_master'] = sha(imported) == EXPECTED_SHA256
            if not checks['imported_structure_matches_master']:
                failures.append('Downloaded imported object differs from master')
        else:
            incomplete.append(f'Downloaded imported object unavailable: {imported}')
    else:
        limits.append('Imported MOS-object byte identity not checked; only local uploaded source hash verified')
    inp = documents.get('input.json', {})
    if isinstance(inp, dict):
        project = inp.get('project_id')
        checks['project_id'] = project
        if project is None:
            incomplete.append('input.json lacks project_id')
        elif str(project) != args.project_id:
            failures.append('input.json project_id differs from expected rerun project')
        if 'submitted_prompt' in inp and prompt.is_file() and inp['submitted_prompt'] != prompt.read_text():
            failures.append('input.json submitted_prompt differs from submitted-prompt.txt')
        for key in ['input_file_sha256', 'master_sha256', 'input_structure_sha256', 'structure_sha256']:
            if key in inp and inp[key] != EXPECTED_SHA256:
                failures.append(f'input.json {key} differs from master')

    tasks = task_rows(documents.get('results.json', {}))
    for filename in args.task_status:
        try:
            tasks.extend(task_rows(read_json(local_path(filename))))
        except (ValueError, OSError) as error:
            failures.append(f'Task status {filename}: {error}')
    task_observations = []
    if not tasks:
        incomplete.append('No explicit task IDs and statuses captured')
    for row in tasks:
        task_id = str(row.get('task_id', row.get('id', '')))
        status = str(row.get('status', '')).strip()
        stage = row.get('stage', row.get('role', row.get('task_type', row.get('task_name', row.get('name')))))
        task_observations.append({'task_id': task_id, 'status': status, 'stage_or_ownership': stage, 'source_file': row.get('source_file', row.get('status_file'))})
        if not task_id or task_id in ORIGINAL_TASK_IDS:
            failures.append(f'Missing or historical task ID used for rerun: {task_id}')
        if status.lower() in FAILURE:
            failures.append(f'Task {task_id} reported {status}')
        elif status.lower() not in SUCCESS:
            incomplete.append(f'Task {task_id} not confirmed successful: {status or "unknown"}')
    checks['task_observations'] = task_observations
    checks['task_count_observed'] = len({row['task_id'] for row in task_observations})

    record_path = local_path(args.record) if args.record else None
    if record_path is None:
        candidates = sorted((RUN / 'raw').rglob('record.json'))
        if len(candidates) == 1:
            record_path = candidates[0]
        elif len(candidates) > 1:
            incomplete.append('Multiple record.json files: select current record with --record')
    native_rows = None
    if record_path is not None and record_path.is_file():
        try:
            record = read_json(record_path)
            native_rows = record.get('annotations', {}).get('homology')
            if not isinstance(native_rows, list) or not all(isinstance(row, dict) for row in native_rows):
                failures.append('Current native annotations.homology must be a list of objects')
                native_rows = None
            else:
                checks['native_record'] = str(record_path.relative_to(RUN))
                checks['native_record_sha256'] = sha(record_path)
                checks['native_homolog_rows'] = len(native_rows)
                checks['native_homologs_empty'] = len(native_rows) == 0
        except (ValueError, OSError, AttributeError) as error:
            failures.append(f'Current native record: {error}')
    elif args.allow_missing_record:
        limits.append('Current native record unavailable; no native homology count asserted')
    else:
        incomplete.append('Current native record.json unavailable')
    if args.homologs:
        try:
            rows = homolog_rows(read_json(local_path(args.homologs)))
            if not isinstance(rows, list) or not all(isinstance(row, dict) for row in rows):
                failures.append('Extracted homolog JSON must contain a list of row objects')
            else:
                checks['extracted_homolog_rows'] = len(rows)
                if native_rows is not None and rows != native_rows:
                    failures.append('Extracted homolog rows differ from native record rows')
        except (ValueError, OSError) as error:
            failures.append(f'Extracted homologs: {error}')
    if args.expected_homolog_count is not None:
        if native_rows is None:
            incomplete.append('Cannot verify expected homolog count without native rows')
        elif len(native_rows) != args.expected_homolog_count:
            failures.append('Native homolog count differs from expected observed count')

    status = 'failed' if failures else 'incomplete' if incomplete else 'passed_with_limits' if limits else 'passed'
    now = datetime.now(timezone.utc)
    validation = {'schema_version': '1.0', 'generated_at': now.isoformat(), 'local_time': now.astimezone(ZoneInfo('Asia/Jakarta')).isoformat(), 'status': status, 'checks': checks, 'failures': failures, 'incomplete_evidence': incomplete, 'scope_limits': limits, 'new_tasks_submitted_by_this_script': False}
    write_json(RUN / 'validation.json', validation)
    zip_path = local_path(args.zip) if args.zip else RUN.parent / (RUN.name + '.zip')
    excluded = {RUN / 'manifest.json', RUN / 'SHA256SUMS.txt', zip_path}
    files = []
    for path in sorted(RUN.rglob('*')):
        if not path.is_file() or path in excluded or path.name == '.DS_Store' or '__pycache__' in path.parts:
            continue
        files.append({'path': path.relative_to(RUN).as_posix(), 'bytes': path.stat().st_size, 'sha256': sha(path)})
    manifest = {'schema_version': '1.0', 'generated_at': now.isoformat(), 'validation_status': status, 'project_id': args.project_id, 'files': files, 'file_count': len(files), 'total_bytes': sum(row['bytes'] for row in files), 'hash_policy': 'manifest.json and SHA256SUMS.txt excluded from own inventory; validation.json included; optional ZIP is outside inventory'}
    write_json(RUN / 'manifest.json', manifest)
    sums = [f"{row['sha256']}  {row['path']}" for row in files]
    sums.append(f"{sha(RUN / 'manifest.json')}  manifest.json")
    (RUN / 'SHA256SUMS.txt').write_text('\n'.join(sums) + '\n')
    output = {'status': status, 'files': len(files), 'validation': str(RUN / 'validation.json'), 'manifest': str(RUN / 'manifest.json')}
    if args.zip is not None:
        zip_path.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as archive:
            for name in [row['path'] for row in files] + ['manifest.json', 'SHA256SUMS.txt']:
                archive.write(RUN / name, RUN.name + '/' + name)
        output.update(zip=str(zip_path), zip_sha256=sha(zip_path))
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 1 if failures else 2 if incomplete else 0


if __name__ == '__main__':
    sys.exit(main())
