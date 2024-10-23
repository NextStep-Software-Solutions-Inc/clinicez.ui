"use client";

import { getGoogleAccessToken, getGoogleAuthUrl, insertToCalendar } from "@actions/google/auth.action";
import { Button } from "@components/ui/button";
import React from "react";
import { toast } from "sonner";

export default function ClientPage() {
    
  const action = async () => {
    const url = await getGoogleAuthUrl("http://localhost:3000/api/google/code");
    if(!url) {
      toast.error("Error fetching auth url");
      return;
    }
    window.open(url, "_blank");
  }

  const getAccessToken = async () => {
    const token = await getGoogleAccessToken();
    toast.info(token);
  }

  const insert = async () => {
    await insertToCalendar("cassandramaureenyecyec@gmail.com");
  }

  return (
    <div>
      <h1>Client</h1>
      <Button onClick={action} >Click me</Button>
      <Button onClick={getAccessToken} >GetAccessToken</Button>
      <Button onClick={insert} >InsertToCalendar</Button>
    </div>
  );
}
