import { Metadata } from "next";
import Image from "next/image";
import clinicEZMiniLogo from "@public/assets/hero-img-1.png";

export const metadata: Metadata = {
  title: "Home | Clinic EZ ",
  description: "Optimized Healthcare Management System",
};

export default async function HomePage() {
  
  return (
    <main className="content">
      <section className="bg-gradient-to-l from-[#6DEBF4] via-[#C3FBFF] to-[#D3FCFF] bg-opacity-30">
        <div className="relative container mx-auto p-2 sm:py-16 lg:py-24">
          <div className="mx-auto sm:px-6 lg:px-8">
            <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2">
              <div>
                <p className="text-base font-semibold tracking-wider text-gray-500 uppercase">Optimized Healthcare Management System</p>
                <h1 className="mt-4 text-4xl font-bold text-teal-600 lg:mt-8 sm:text-6xl xl:text-8xl">Revitalize in an <span className="text-white rounded-3xl font-extralight text-7xl px-4 leading-tight" style={{
                  background: "linear-gradient(135deg, rgba(62,236,225,1) 0%, rgba(49,205,188,1) 15%, rgba(44,171,152,1) 70%, rgba(7,167,136,1) 100%)",
                  borderRadius: "34% 66% 69% 31% / 44% 51% 49% 56%"
                }} >ez</span> way.</h1>
                <p className="mt-4 text-base text-gray-600 lg:mt-8 sm:text-xl">Join Health Organization and Manage Your Health Records</p>

                <a href="/api/auth/login" title="" className="inline-flex items-center px-6 py-4 mt-8 font-semibold text-white transition-all duration-200 bg-teal-600 rounded-full lg:mt-16 hover:bg-teal-400 focus:bg-teal-400" role="button">
                                Join for free
                  <svg className="w-6 h-6 ml-8 -mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </a>

                <p className="mt-5 text-gray-600">Already joined us? <a href="/api/auth/login" title="" className="text-black transition-all duration-200 hover:underline">Log in</a></p>
              </div>

              <div className="absolute bottom-0 right-0 w-[40rem]">
                <div className="bg-clip-content bg-teal-500 rounded-t-full absolute bottom-0 right-0 w-full h-1/2"></div>
                <Image 
                  width={700}
                  height={700}
                  className="w-full max-h-[50rem] hidden lg:block relative" 
                  src={clinicEZMiniLogo} alt="clinic-ez-mini-logo" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
