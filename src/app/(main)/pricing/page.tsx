import Link from "next/link";

const PricingPage = () => {
  const plans = [
    { 
      name: 'Basic', 
      price: '₱500/month',
      features: ['5 Users', 'Basic Support', '500GB Storage']
    },
    { 
      name: 'Small', 
      price: '₱1000/month',
      features: ['15 Users', 'Priority Support', '1TB Storage', 'Data Backup']
    },
    { 
      name: 'Large', 
      price: '₱1500/month',
      features: ['Unlimited Users', '24/7 Support', 'Unlimited Storage', 'Data Backup', 'Analytics Dashboard']
    },
  ];
  
  return (
    <div className="content container mx-auto px-4">
      <div className="prose">
        <h2 className="">Pricing</h2>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Rerum dolorem sunt natus sint nostrum ea fuga ex delectus quos, laborum, voluptate, corporis harum sequi impedit accusamus sed corrupti iure atque?</p>
      </div>
      <div className="flex flex-wrap justify-center mt-10">
        {plans.map((plan, index) => (
          <div key={index} className="flex flex-col justify-between bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-lg p-8 m-2 rounded-lg max-w-sm w-full sm:w-1/2 lg:w-1/3 text-white">
            <div>
              <h2 className="text-2xl mb-2">{plan.name}</h2>
              <p className="text-xl">{plan.price}</p>
              <ul className="list-disc list-inside">
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            <Link href={{
              pathname: "/tenants/register",
              query: {
                role: "tenant",
                plan: plan.name.toLocaleLowerCase()
              }
            }}>
              <button className="w-full mt-4 bg-white text-teal-500 px-4 py-2 rounded">Select</button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
  
export default PricingPage;