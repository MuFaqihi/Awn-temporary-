"use client";
import React from "react";

type Props = {
  locale: string;
};

export default function BookSession({ locale }: Props) {
  return (
    <div>
      <h2>Book a session</h2>
      <p>Locale: {locale}</p>
      <p>This is a placeholder BookSession component used to satisfy the import during build.</p>
    </div>
  );
}
