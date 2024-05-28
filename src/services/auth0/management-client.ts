
import { ManagementClient, ManagementClientOptionsWithClientSecret } from 'auth0';
type CreateManagementClientOptions = ManagementClientOptionsWithClientSecret & {

}

export const createManagementClient = (options: CreateManagementClientOptions) => {

  const managementClient = new ManagementClient(options)

  return managementClient;
}

export const managementClient = createManagementClient({
  domain: "dev-tk5vlh506xnry060.us.auth0.com",
  clientId: "A0dSF4f5WKB2unYgy895vEhy61THD1PD",
  clientSecret: "IG7ZV3-0EK12r4LiBcZH6cw6dO_QH1pCfocU9mbb4-uS8EOfVSJTLTwtYqtZn3Yo",
});

