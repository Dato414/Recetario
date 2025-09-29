"use client";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button } from "@heroui/react";
import Link from "next/link";
import { useParams } from 'next/navigation'

type Props = {
  title?: string;
  recipeName?: string;
  onSave?: () => void; 
  showSave? : boolean;
};

export default function NavbarGeneral({
  
  title = "Recetas",
  recipeName,
  onSave = () => {},  
  showSave = true            
}: Props) {
  const params = useParams()
  return (
    <Navbar
      className="mx-auto"
      classNames={{
        wrapper:"w-full justify-between",
        item: [
          "flex","relative","h-full","items-center",
          "data-[active=true]:after:content-['']",
          "data-[active=true]:after:absolute",
          "data-[active=true]:after:bottom-0",
          "data-[active=true]:after:left-0",
          "data-[active=true]:after:right-0",
          "data-[active=true]:after:h-[2px]",
          "data-[active=true]:after:rounded-[2px]",
          "data-[active=true]:after:bg-primary",
        ],
      }}
    >
      <NavbarBrand>
        <Link href="/"><Button as="span">Volver</Button></Link>
      </NavbarBrand>

      <NavbarContent className=" flex gap-4"  justify="center">
        <NavbarItem>
          <h1 className="text-lg font-semibold truncate max-w-[60vw]">
            {recipeName ?? title}
          </h1>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          {showSave && (

            <Button color="secondary" onPress={onSave}>Guardar</Button>
            )
          }
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
