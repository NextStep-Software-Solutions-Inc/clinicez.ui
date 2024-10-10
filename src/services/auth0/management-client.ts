
import { ManagementClient, ManagementClientOptionsWithClientSecret } from 'auth0';
type CreateManagementClientOptions = ManagementClientOptionsWithClientSecret & {
}

export const createManagementClient = (options: CreateManagementClientOptions) => {
  
  const managementClient = new ManagementClient(options)
  
  return managementClient;
}

export const managementClient = createManagementClient({
  domain: process.env.AUTH0_ISSUER_BASE_URL?.split('https://')[1] ?? "",
  clientId: process.env.AUTH0_CLIENT_ID ?? "",
  clientSecret: process.env.AUTH0_CLIENT_SECRET ?? ""
});