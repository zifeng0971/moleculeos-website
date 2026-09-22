/* eslint-disable @next/next/no-img-element */
import './Icon.css'

type IconProps = {
  src: string | { src: string }
  width: number
  height: number
  alt?: string
}

export function Icon({ src, width, height, alt = '' }: IconProps) {
  const imageSrc = typeof src === 'string' ? src : src.src
  return (
    <span className="mocha-icon" style={{ width, height }}>
      <img src={imageSrc} alt={alt} width={width} height={height} />
    </span>
  )
}
