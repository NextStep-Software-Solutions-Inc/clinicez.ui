"use client"

import type dynamicIconImports from "lucide-react/dynamicIconImports"
import HeaderTitle from "./HeaderTitle"
import Icon from "./Icon"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface SectionAProps {
  title: string
  description?: string
  className?: string
  image?: {
    src: string
    alt: string
    width?: number
    height?: number
  }
  card?: {
    icon: keyof typeof dynamicIconImports
    title: string
    description?: string
    className?: string
  }[]
}

export default function SectionA({ title, description, className, image, card }: SectionAProps) {
  return (
    <div className={cn("flex flex-col justify-center items-center text-center py-24", "bg-white", className)}>
      {/* Reduced width container */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4">
        <div className="mb-12 md:mb-16 w-full">
          <HeaderTitle header={title} description={description} />
        </div>

        {image ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="flex justify-center lg:justify-start">
              <div className="relative w-full max-w-md lg:max-w-none">
                <Image
                  src={image.src || "/placeholder.svg"}
                  alt={image.alt}
                  width={image.width || 500}
                  height={image.height || 400}
                  className="w-full h-auto rounded-lg shadow-lg object-cover"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {card?.map((item, index) => (
                <Card
                  key={index}
                  className={cn(
                    "p-6 md:p-8 flex flex-row hover:shadow-lg transition-all duration-300 border-gray-200/30 bg-white/30 backdrop-blur-sm relative overflow-hidden",
                    item.className,
                  )}
                >
                  <div className="flex-shrink-0 mr-4 md:mr-6">
                    <div className="p-2 md:p-3 bg-teal-100 rounded-full">
                      <Icon name={item.icon} className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <CardTitle className="text-base md:text-lg lg:text-xl mb-2 md:mb-3 text-gray-900 leading-tight text-left">
                      {item.title}
                    </CardTitle>
                    {item.description && (
                      <CardDescription className="text-sm md:text-base text-gray-600 leading-relaxed text-left">
                        {item.description}
                      </CardDescription>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full">
            {card?.map((item, index) => (
              <Card
                key={index}
                className={cn(
                  "p-6 md:p-8 flex flex-col hover:shadow-lg transition-all duration-300 border-gray-200/30 bg-white/30 backdrop-blur-sm relative overflow-hidden",
                  item.className,
                )}
              >
                <div className="flex justify-start mb-4 md:mb-6">
                  <div className="p-2 md:p-3 bg-teal-100 rounded-full">
                    <Icon name={item.icon} className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-start text-left">
                  <CardTitle className="text-base md:text-lg lg:text-xl mb-2 md:mb-3 text-gray-900 leading-tight">
                    {item.title}
                  </CardTitle>
                  {item.description && (
                    <CardDescription className="text-sm md:text-base text-gray-600 leading-relaxed">
                      {item.description}
                    </CardDescription>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
