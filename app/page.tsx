"use client";
import { useState } from "react";
import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";
import { IoMdAdd, IoMdSearch } from "react-icons/io";
import { title } from "@/components/primitives";
import { Input } from "@heroui/input";
import TableRecetas from "@/components/table-recetas";

export default function Home() {
  const [q, setQ] = useState("");

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>Crea tu proxima&nbsp;</span>
        <span className={title({ color: "violet" })}>receta&nbsp;</span>
        <br />
      </div>

      <div className="flex gap-2">
        <Input
          classNames={{
            base: "max-w-full sm:max-w-[30rem] h-10",
            mainWrapper: "h-full",
            input: "text-small",
            inputWrapper:
              "h-full font-normal text-default-500 bg-default-400/20 dark:bg-default-500/20",
          }}
          placeholder="Buscar receta"
          size="sm"
          startContent={<IoMdSearch size={20} />}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Link
          className={buttonStyles({
            variant: "bordered",
            radius: "lg",
            size: "md",
            fullWidth: "true",
          })}
          href="/create"
        >
          <IoMdAdd size={20} />
          Crear nueva receta
        </Link>
      </div>

      <div className="mt-8">
        <TableRecetas query={q} />
      </div>
    </section>
  );
}
