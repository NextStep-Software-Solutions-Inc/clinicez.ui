import Image from "next/image";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Doctors", href: "/doctors" },
  { name: "Nurses", href: "/nurses" },
  { name: "Organizations", href: "/organization" },
  { name: "Contact Us", href: "/contact-us" },
];

export default function Home() {
  return (
    <main className="bg-white">
      <header className="bg-[#FCF8F1] bg-opacity-30">
          <div className="px-4 mx-auto sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 lg:h-20">
                  <div className="flex-shrink-0">
                      <a href="/" title="" className="flex">
                          <Image 
                            width={100}
                            height={100}
                            className="w-auto" 
                            src="https://i.postimg.cc/VsH4j92b/clinicez-logo.png" alt="" 
                          />
                      </a>
                  </div>

                  <button type="button" className="inline-flex p-2 text-black transition-all duration-200 rounded-md lg:hidden focus:bg-gray-100 hover:bg-gray-100">
                      {/* <!-- Menu open: "hidden", Menu closed: "block" --> */}
                      <svg className="block w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
                      </svg>

                      {/* <!-- Menu open: "block", Menu closed: "hidden" --> */}
                      <svg className="hidden w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                  </button>

                  <div className="hidden lg:flex lg:items-center lg:justify-center lg:space-x-10">
                    {
                      navLinks.map((link) => (
                        <a key={link.name} href={link.href} title="" className="text-base text-black transition-all duration-200 hover:text-opacity-80">{link.name}</a>
                      ))
                    }
                  </div>

                  <a href="/api/auth/login" title="" className="hidden lg:inline-flex items-center justify-center px-5 py-2.5 text-base transition-all duration-200 hover:bg-teal-400 hover:text-white focus:text-white focus:bg-teal-400 font-semibold text-white bg-teal-600 rounded-full" role="button"> Join Now </a>
              </div>
          </div>
      </header>

      <section className="bg-[#FCF8F1] bg-opacity-30 py-10 sm:py-16 lg:py-24">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
              <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2">
                  <div>
                      <p className="text-base font-semibold tracking-wider text-blue-600 uppercase">Optimized Healthcare Management System</p>
                      <h1 className="mt-4 text-4xl font-bold text-black lg:mt-8 sm:text-6xl xl:text-8xl">Revitalize in an <span className="bg-teal-600 text-white rounded-3xl font-extralight text-7xl px-4">ez</span> way.</h1>
                      <p className="mt-4 text-base text-black lg:mt-8 sm:text-xl">Join Health Organization and Manage Your Health Records</p>

                      <a href="#" title="" className="inline-flex items-center px-6 py-4 mt-8 font-semibold text-white transition-all duration-200 bg-teal-600 rounded-full lg:mt-16 hover:bg-teal-400 focus:bg-teal-400" role="button">
                          Join for free
                          <svg className="w-6 h-6 ml-8 -mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                      </a>

                      <p className="mt-5 text-gray-600">Already joined us? <a href="/api/auth/login" title="" className="text-black transition-all duration-200 hover:underline">Log in</a></p>
                  </div>

                  <div>
                      <Image 
                        width={500}
                        height={500}
                        className="w-full" 
                        src="https://i.postimg.cc/d1WGBnfZ/adaptive-icon.png" alt="" 
                        />
                  </div>
              </div>
          </div>
      </section>
  </main>
  );
}
