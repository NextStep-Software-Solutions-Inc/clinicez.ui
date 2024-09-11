"use server";
import  conversation from "@public/json/conversation.json"

export const getConversationAction = async (id: number) => {
  console.log("Getting conversation...", id);
  return conversation.conversation
}
