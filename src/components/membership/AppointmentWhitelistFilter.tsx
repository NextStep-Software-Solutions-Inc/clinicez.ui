"use client";

import ListItem from "@components/ListItem";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import { useUserOrgAppointmentWhitelist } from "@hooks/useUserOrgAppointmentWhitelist";
import { Trash } from "lucide-react";
import { useParams } from "next/navigation";
import UpdateWhitelistFilterModal from "./modal/UpdateWhitelistModal";
import CreateWhitelistFilterModal from "./modal/CreateWhitelistFilterModal";
import { toast } from "sonner";
import AddWhitelistFilterModal from "./modal/AddWhitelistFilterModal";
import { deleteWhitelistFilterAction } from "@actions/filter.action";
import UpdateWhitelistFilter from "./modal/UpdateWhitelistFilterModal";

export default function AppointmentWhitelistFilters() {
  const params = useParams<{organization: string, userId: string}>();
  const {data: whitelists, mutate, isLoading: loadingWhitelist} = useUserOrgAppointmentWhitelist(params.organization, decodeURIComponent(params.userId));

  if(loadingWhitelist) return <div>Loading whitelist...</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle>
        
        </CardTitle>
        <CardTitle className="flex flex-wrap gap-2 items-center justify-between">
          <span>Appointment Whitelist Filters</span>
          {
            whitelists?.data?.length === 0 &&
            <CreateWhitelistFilterModal
              onUpdated={mutate}
              orgUid={params.organization}
              userId={params.userId}
            />
          }
        </CardTitle>
        <CardDescription>
        Filters to whitelist appointments for this member.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Each
          of={whitelists?.data ?? []}
          render={whitelist => {
            return (
              <WhitelistFilter
                onUpdated={mutate}
                whitelist={{
                  name: whitelist.name,
                  whitelistId: whitelist.id,
                  filters: whitelist.WhitelistFilters.map((filter) => ({
                    id: filter.id,
                    value: filter.value,
                    filter: filter.Filter
                  }))
                }}
              />
            )
          }}
        />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}

interface WhitelistFilterProps {
  onUpdated?: () => void;
  whitelist: {
    name: string;
    whitelistId: number;
    filters: {
      id: number;
      value: string;
      filter: {
          id: number;
          name: string;
          key: string;
      };
    }[]
  }
}
export const WhitelistFilter = ({onUpdated, whitelist}: WhitelistFilterProps) => {
  const {name, whitelistId, filters = []} = whitelist;

  const handleDeleteFilter = async (filterId: number) => {
    toast.promise(deleteWhitelistFilterAction(filterId), {
      loading: "Deleting filter...",
      success: (res) => {
        if(res.status) {
          onUpdated?.()
        }
        return res.message
      },
      error: "An error occurred while deleting filter."
    });

  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap gap-2 items-center justify-between group/whitelist">
          <span className="flex gap-2">
            {name} 
            <UpdateWhitelistFilterModal
              whitelistId={whitelistId}
              name={name}
              onUpdated={onUpdated}
            />
          </span>
          <AddWhitelistFilterModal
            whitelistId={whitelistId}
            onAddWhitelistFilter={onUpdated}
          />
        </CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>

        <Each
          of={filters}
          render={(filter) => {
            return (
              <ListItem
                name={filter.filter.name}
                description={`key: '${filter.filter.key}' - value: '${filter.value}' `}
                actions={<Actions 
                  filter={filter}
                  onDelete={() => handleDeleteFilter(filter.id)}
                  onEdit={onUpdated}
                />}
              />
            )
          }}
        />
        
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}

interface ActionsProps {
  filter: {
    id: number;
    value: string;
    filter: {
      id: number;
      name: string;
      key: string;
    }
  }
  onEdit?: () => void;
  onDelete?: () => void;
}
const Actions = ({filter, onDelete, onEdit}:ActionsProps) => {

  return (
    <div>
      <UpdateWhitelistFilter
        whitelistFilter={filter}
        onUpdateWhitelistFilter={onEdit}
      />
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Trash size={16} className="text-destructive"/>
      </Button>
    </div>
  )
}