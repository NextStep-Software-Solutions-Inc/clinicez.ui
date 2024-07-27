import { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";

export class MiddlewareStack {
  private stack: NextMiddleware[] = [];
  
  use(middleware: NextMiddleware) {
    this.stack.push(middleware);
  }
  
  
  async execute(req: NextRequest, event: NextFetchEvent) {
    for (const middleware of this.stack) {
      if(middleware)
        return middleware(req, event);
    }
  }
}
  