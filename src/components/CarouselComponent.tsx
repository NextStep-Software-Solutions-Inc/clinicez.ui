'use client'
import Image from 'next/image';
import doctorsData from '../../public/doctors.json';
import { useState } from 'react';

const CarouselComponent = () => {
 const [currentIndex, setCurrentIndex] = useState(0);
 const doctorsPerPage = 3;

 const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? Math.ceil(doctorsData.doctors.length / doctorsPerPage) - 1 : prevIndex - 1));
 };

 const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === Math.ceil(doctorsData.doctors.length / doctorsPerPage) - 1 ? 0 : prevIndex + 1));
 };

 return (
    <div className="relative flex justify-center items-center h-screen">
      <button onClick={handlePrev} className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-gray-200 rounded-full">&lt;</button>
      <button onClick={handleNext} className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-gray-200 rounded-full">&gt;</button>
      <div className="relative flex justify-center items-center w-full overflow-hidden">
        <div className="flex space-x-4" style={{
          transition: 'transform 0.5s ease-in-out',
          transform: `translateX(-${currentIndex * (100 / Math.ceil(doctorsData.doctors.length / doctorsPerPage))}%)`
        }}>
          {doctorsData.doctors.map((doctor, index) => (
            <div key={doctor.id} className="flex-shrink-0 m-2" style={{ flex: `0 0 ${100 / doctorsPerPage}%` }}>
              <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-md"> {/* This div creates the box around each doctor */}
                <div className="w-32 h-32 overflow-hidden rounded-lg"> {/* Adjusted to fit within the box without being circular */}
                 <Image src={doctor.photoUrl} alt={doctor.name} width={128} height={128} />
                </div>
                <div className="mt-2">
                 <h3 className="text-lg font-semibold">{doctor.name}</h3>
                 <p className="text-sm text-gray-500">{doctor.specialty}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div> 
 );
};

export default CarouselComponent;
