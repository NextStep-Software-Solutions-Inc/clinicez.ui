"use client";
import Link from "next/link";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs"; // Assuming TabsList and TabsTrigger are available

const PricingPage = () => {
  const [activeTab, setActiveTab] = useState("monthly");

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
    <div className="container mx-auto px-4">
      <div className="prose">
        <h2 className="text-teal-500">Pricing </h2>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Rerum dolorem sunt natus sint nostrum ea fuga ex
          delectus quos, laborum, voluptate, corporis harum sequi impedit accusamus sed corrupti iure atque?
        </p>
      </div>
      <div className="flex justify-end">
      <Tabs defaultValue="monthly">
      <TabsList className="rounded-lg">
        <TabsTrigger
          value="monthly"
          onClick={() => setActiveTab("monthly")}
          style={{ color: activeTab === "monthly" ? 'teal' : 'inherit' }}
        >
          Monthly
        </TabsTrigger>
        <TabsTrigger
          value="yearly"
          onClick={() => setActiveTab("yearly")}
          style={{ color: activeTab === "yearly" ? 'teal' : 'inherit' }}
        >
          Yearly
        </TabsTrigger>
      </TabsList>
    </Tabs>
      </div>
      <div className="flex flex-wrap justify-center mt-10">
        {plans.map((plan, index) => (
          activeTab === "monthly" && (
            <div key={index} className="relative bg-teal-500 opacity-80 max-w-sm w-48 h-96 sm:w-1/2 lg:w-1/3 m-5 shadow-lg shadow-teal-500">
              <div className="bg-white hover:from-teal-600 hover:to-teal-700 shadow-lg p-8 mr-6 h-80 relative z-10 ">
                <p className="text-2xl font-bold mb-4">{plan.price}</p>
                <h2 className="text-xl mb-8 font-bold border-b-2 border-gray-200 pb-2">{plan.name}</h2>
                <ul className="list-none list-inside text-sm">
                  {plan.features.map((feature, index) => (
                    <li key={index} className={index !== 0 ? 'mt-4' : ''}>{feature}</li>
                  ))}
                </ul>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Link href={{ pathname: "/tenants/register", query: { role: "tenant", plan: plan.name.toLocaleLowerCase() } }}>
                  <button className=" text-white">Choose Plan</button>
                </Link>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
