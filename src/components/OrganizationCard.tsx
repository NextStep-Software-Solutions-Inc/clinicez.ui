export function OrganizationCard({ name, imageSrc, details, url }: { name: string; imageSrc: string, details: string, url: string }) {
  return (
    <div className="group bg-white rounded-lg shadow-md overflow-hidden relative">
      <a href={url}>
        <div className="group bg-white shadow-md overflow-hidden relative">
          <img src={imageSrc} alt={name} className="w-full h-[25rem]" />
          <div className="absolute inset-0 bg-teal-700 opacity-0 transition duration-300 ease-in-out group-hover:opacity-70 flex items-center justify-center text-white">
            <div>
              <p className="text-sm text-center p-2">{details}</p>
            </div>
          </div>
        </div>
        <div className="p-4 relative z-10">
          <h2 className="font-medium mb-2">{name}</h2>
        </div>
      </a>
    </div>
  );
}