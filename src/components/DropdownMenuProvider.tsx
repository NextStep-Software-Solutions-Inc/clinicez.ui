"use client"
import React from "react"

interface DropdownMenuProps {
    children: React.ReactNode;
}

interface DropdownMenuContextProps {
    dropdownOpen: boolean;
    setDropdownOpen: (open: boolean) => void;
    hasOpenDialog: boolean;
    dropdownTriggerRef: React.MutableRefObject<null>;
    handleDialogItemSelect: (e: Event) => void;
    handleDialogItemOpenChange: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextProps | undefined>(undefined);
export const useDropdownMenu = () => React.useContext(DropdownMenuContext);

export function DropdownMenuProvider({children}: DropdownMenuProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [hasOpenDialog, setHasOpenDialog] = React.useState(false);
  const dropdownTriggerRef = React.useRef(null);
  const focusRef = React.useRef(null);

  function handleDialogItemSelect(e: Event) {
    e.preventDefault();
    focusRef.current = dropdownTriggerRef.current;
  }

  function handleDialogItemOpenChange(open: boolean) {
    setHasOpenDialog(open);
    if (open === false) {
      setDropdownOpen(false);
    }
  }
  return (
    <DropdownMenuContext.Provider value={{dropdownOpen, setDropdownOpen, hasOpenDialog, dropdownTriggerRef, handleDialogItemSelect, handleDialogItemOpenChange}}>
      {children}
    </DropdownMenuContext.Provider>
  )
}
