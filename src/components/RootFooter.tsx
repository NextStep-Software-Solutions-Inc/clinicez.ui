const RootFooter = () => {
    return (
        <footer className="bg-gray-800 text-white py-8 px-4">
            <div className="container mx-auto">
                <div className="flex flex-wrap justify-between">
                    <div className="w-full md:w-1/4 text-center md:text-left">
                        <h5 className="uppercase mb-6 font-bold">Links</h5>
                        <ul className="mb-4">
                            <li className="mt-2">
                                <a href="/organizations" className="hover:underline text-gray-200 hover:text-white">Organizations</a>
                            </li>
                            <li className="mt-2">
                                <a href="/doctors" className="hover:underline text-gray-200 hover:text-white">Doctors</a>
                            </li>
                            <li className="mt-2">
                                <a href="/nurses" className="hover:underline text-gray-200 hover:text-white">Nurses</a>
                            </li>
                        </ul>
                    </div>
                    <div className="w-full md:w-1/4 text-center md:text-left">
                        <h5 className="uppercase mb-6 font-bold">Legal</h5>
                        <div className="mb-6">
                            <a href="/terms" className="hover:underline text-gray-200 hover:text-white">Terms</a>
                            <a href="/privacy" className="hover:underline text-gray-200 hover:text-white ml-4">Privacy</a>
                        </div>
                    </div>
                    <div className="w-full md:w-1/4 text-center md:text-left">
                        <h5 className="uppercase mb-6 font-bold">Contact</h5>
                        <p><a href={`mailto:info@clinic-ez.com`} className="mb-6">info@clinic-ez.com</a></p>
                        <p><a href={`tel:09123456789`} className="mb-6">09123456789</a></p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default RootFooter;