import AnimatedLogo from "./AnimatedLogo";

const RootFooter = () => {
  return (
    <footer className="container mx-auto py-8 bg-slate-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <a href="/" className="flex h-20">
            <AnimatedLogo/>
          </a>
          <p className="mt-2">
            <strong>Clinic EZ</strong> is a platform that connects healthcare providers with patients. We provide a platform for healthcare providers to manage their appointments and patients to book appointments with their healthcare providers.
            Join our platform and be part of the future of healthcare.
          </p>
          
        </div>
        <div className="flex flex-wrap justify-between mt-8">
          <div className="w-full md:w-1/3 text-center sm:text-left">
            <h5 className="mb-4 font-semibold">Links</h5>
            <ul className="mb-4 ">
              <li className="">
                <a href="/organizations" className="hover:underline hover:text-primary">Organizations</a>
              </li>
              <li className="">
                <a href="/healthcare-provider/doctors" className="hover:underline hover:text-primary">Our Doctors</a>
              </li>
              <li className="">
                <a href="/healthcare-provider/nurses" className="hover:underline hover:text-primary">Our Nurses</a>
              </li>
              <li className="">
                <a href="/tenants/register" className="hover:underline hover:text-primary">Be a Tenant</a>
              </li>
              <li className="">
                <a href="/healthcare-provider/apply" className="hover:underline hover:text-primary">Healthcare Provider</a>
              </li>
            </ul>
          </div>
          <div className="w-full md:w-1/3 text-center sm:text-left">
            <h5 className="mb-4 font-semibold">Legal</h5>
            <div className="mb-4">
              <a href="/terms" className="hover:underline hover:text-primary">Terms</a>
              <a href="/privacy" className="hover:underline hover:text-primary ml-4">Privacy</a>
            </div>
          </div>
          <div className="w-full md:w-1/3 text-center sm:text-left">
            <h5 className="mb-4 font-semibold">Contact</h5>
            <p><a href={`mailto:info@clinic-ez.com`} className="mb-6">info@clinic-ez.com</a></p>
            <p><a href={`tel:09123456789`} className="mb-6">09123456789</a></p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default RootFooter;