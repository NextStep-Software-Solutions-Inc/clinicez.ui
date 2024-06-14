"use server";


import prisma from "@lib/prisma";
import { Prisma } from "@prisma/client";



export const createOrganizationAction = async (data: Prisma.OrganizationCreateArgs["data"]) => {

  const newOrganization = await prisma.organization.create({
    data: { 
      ...data
    }
  });
  
  return newOrganization;
};
  
export const getOrganizationsAction = async () => {

  const organizations = await prisma.organization.findMany({
    where: {
      isActive: true
    }
  });
    
  return organizations;
};

export const getOrganizationAction = async (id: number) => {

  const organization = await prisma.organization.findUnique({
    where: {
      id: id
    }
  });

  return organization;
}