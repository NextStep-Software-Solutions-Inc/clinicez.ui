"use client";
import LocalCarouselItem , { type ICarouselItemProps} from "@components/CarouselItem";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@components/ui/carousel"
import Each from "./utils/Each";
import { cn } from "@lib/utils";

interface ICarouselWrapperProps {
  items: ICarouselItemProps["item"][];
}
export default function CarouselWrapper({items}:ICarouselWrapperProps) {
  
  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        <Each
          of={items}
          render={(item, index) => (
            <CarouselItem className={cn("flex-grow",
              items.length > 1 && "md:basis-1/2",
              items.length > 2 && "lg:basis-1/3",

            )}>
              <Link href={`profile/${item.id}?_type=${item.type}`} key={item.id}>
                <LocalCarouselItem item={item}/>
              </Link>
            </CarouselItem> 
          )}        
        />
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>

  )
}
