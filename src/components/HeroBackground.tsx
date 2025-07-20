interface HeroBackgroundProps {
  imagePath?: string
  opacity?: number
}

export default function HeroBackground({ imagePath = "/assets/hero-v2.png", opacity = 0.3 }: HeroBackgroundProps) {
  return (
    <div
      className="fixed top-0 left-0 w-full h-screen bg-no-repeat bg-cover bg-center z-[-1]"
      style={{
        backgroundImage: `url('${imagePath}')`,
        opacity: opacity,
      }}
    />
  )
}