
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import ActionButton from "@components/ActionButton";
import { Checkbox } from "@components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import Each from "@components/utils/Each";



export const OrgMembershipSettings = () => {
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership</CardTitle>
        <CardDescription>
          Manage membership for your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
       
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}