"use client";
import React, { useState } from 'react';

interface ICarouselProps {
    children: React.ReactNode[];
    showArrows?: boolean;
    perPage?: number;
}

export default function Carousel(props: ICarouselProps) {
    const { children, showArrows = true, perPage = 3 } = props;
    const [activeIndex, setActiveIndex] = useState(0);

    const nextSlide = () => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % children.length);
    };

    const prevSlide = () => {
        setActiveIndex((prevIndex) => (prevIndex - 1 + children.length) % children.length);
    };

    return (
        <div className='flex flex-col items-center relative'>
            <div className='w-full overflow-hidden'>
                <div className='flex transition-transform duration-500 ease-in-out' style={{ transform: `translateX(-${activeIndex * (100 / perPage)}%)` }}>
                    {React.Children.map(children, (child, index) => (
                        <div className='w-full flex flex-col items-center justify-center p-5' style={{ flex: `0 0 ${100 / perPage}%` }}>
                            {child}
                        </div>
                    ))}
                </div>
            </div>
            {showArrows && (
                <div className='absolute top-[50%] flex w-full justify-between items-center'>
                    <button onClick={prevSlide} className='btn btn-ghost text-teal-600 text-2xl'>❮</button>
                    <button onClick={nextSlide} className='btn btn-ghost text-teal-600 text-2xl'>❯</button>
                </div>
            )}
        </div>
    );
}
