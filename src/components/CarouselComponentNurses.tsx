'use client'
import Image from 'next/image';
import nursesData from '../../public/nurses.json';
import { useState, useEffect } from 'react';

const CarouselComponentNurses = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nursesPerPage, setNursesPerPage] = useState(3);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? Math.ceil(nursesData.nurses.length / nursesPerPage) - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === Math.ceil(nursesData.nurses.length / nursesPerPage) - 1 ? 0 : prevIndex + 1));
  };

  useEffect(() => {
    const handleResize = () => {
      // Adjust the number of nurses per page based on screen size
      if (window.innerWidth < 768) {
        setNursesPerPage(1);
      } else if (window.innerWidth < 1024) {
        setNursesPerPage(2);
      } else {
        setNursesPerPage(3);
      }
    };

    handleResize(); // Call once to set initial value
    window.addEventListener('resize', handleResize); // Add event listener for resize

    return () => {
      window.removeEventListener('resize', handleResize); // Cleanup event listener
    };
  }, []);

  return (
    <div className="relative flex justify-center items-center h-screen">
      <button onClick={handlePrev} className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-gray-200 rounded-full">&lt;</button>
      <button onClick={handleNext} className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-gray-200 rounded-full">&gt;</button>
      <div className="relative flex justify-center items-center w-full overflow-hidden">
        <div className="flex space-x-4" style={{
          transition: 'transform 0.5s ease-in-out',
          transform: `translateX(-${currentIndex * (100 / Math.ceil(nursesData.nurses.length / nursesPerPage))}%)`
        }}>
          {nursesData.nurses.map((nurse, index) => (
            <div key={nurse.id} className="flex-shrink-0 m-2" style={{ flex: `0 0 ${100 / nursesPerPage}%` }}>
              <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-md">
                <div className="w-32 h-32 overflow-hidden rounded-lg">
                  <Image src={nurse.photoUrl} alt={nurse.name} width={128} height={128} />
                </div>
                <div className="mt-2">
                  <h3 className="text-lg font-semibold">{nurse.name}</h3>
                  <p className="text-sm text-gray-500">{nurse.specialty}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarouselComponentNurses;
