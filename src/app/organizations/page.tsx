const organizations = [
    {
        name: "Healthcare Information and Management System (HIMS) by University of Science and Technology of Southern Philippines (USTP)",
        description: "The Healthcare Information and Management System (HIMS) is a web-based application that is designed to manage the health records of the patients. It is developed by the University of Science and Technology of Southern Philippines (USTP) in Cagayan de Oro City, Misamis Oriental, Philippines.",
        url: "https://dev-hims.vercel.app",
        logo: "https://i.postimg.cc/4yYVQVbG/organization1-logo.png"
    },
    {
        name: "Xavier University - Ateneo de Cagayan",
        description: "Xavier University - Ateneo de Cagayan is a private Catholic university run by the Philippine Province of the Society of Jesus in Cagayan de Oro City, Misamis Oriental, Philippines.",
        url: "https://www.xu.edu.ph",
        logo: "https://i.postimg.cc/7Y1J5h0C/organization2-logo.png"
    }, 
    {
        name: "Misamis Oriental Provincial Hospital",
        description: "The Misamis Oriental Provincial Hospital is a government-owned hospital in Cagayan de Oro City, Misamis Oriental, Philippines.",
        url: "https://www.facebook.com/misamisorientalprovincialhospital",
        logo: "https://i.postimg.cc/3N2W6Z8h/organization3-logo.png"
    }, 
    {
        name: "Northern Mindanao Medical Center",
        description: "The Northern Mindanao Medical Center is a government-owned hospital in Cagayan de Oro City, Misamis Oriental, Philippines.",
        url: "https://www.facebook.com/nmmc.doh",
        logo: "https://i.postimg.cc/7Y1J5h0C/organization2-logo.png"
    }
]

export default async function OrganizationsPage() {
    return (
        <div className="prose mx-auto text-center">
            <div className="bg-teal-600 pt-5 pb-2">
                <h1 className="text-white">Clinic EZ Partner Organizations</h1>
                <p>
                Select an organization to visit their website and learn more about their services.
                </p>
            </div>

        {
            organizations.map((organization) => (
                <article className="" key={organization.name}>
                    <img className="w-full" src={organization.logo} alt={organization.name} />
                    <h2>{organization.name}</h2>
                    <p>{organization.description}</p>
                    <a href={organization.url} title={organization.name}>Visit {organization.name}</a>
                    <hr className=""/>
                </article>
            ))
        }

      </div>
    )
  }
  