"use client"

import React, { useMemo } from "react";
import Carousel from "./Carousel";
import CarouselItem, { type ICarouselItemProps} from "./CarouselItem";
import useBreakpoints from "@hooks/useBreakpoints";

const carouselProps = {
    autoPlay: true,
    autoPlaySpeed: 5000,
    showArrows: true,
    infiniteLoop: true,
    showDots: true,
    perPage: 3
}

interface ICarouselWrapperProps {
  items: ICarouselItemProps["item"][];
}

export default function CarouselWrapper({items}:ICarouselWrapperProps) {

  const {sm, md, lg} = useBreakpoints();
  const perPage = useMemo(() => {
    if(sm) return 1;
    if(md) return 2;
    if(lg) return 3;
    return 3;
  }, [sm, md, lg])
  

  return (
    <Carousel {...carouselProps} perPage={perPage} >
        {items.map((item, index) => (
            <CarouselItem key={index} item={item}/>
        ))}
    </Carousel>
  )
}
