"use client";

import React from "react";
import { PASSWORD_RULES } from "@/lib/password";

/**
 * Live view of the password policy. Stays hidden until there is something to
 * judge, so an untouched form is not greeted by a wall of red.
 */
export default function PasswordChecklist({ value }: { value: string }) {
  if (!value) return null;

  return (
    <ul style={styles.list} aria-live="polite">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        return (
          <li
            key={rule.id}
            style={{ ...styles.item, color: met ? "#15803d" : "#94a3b8" }}
          >
            <span aria-hidden="true" style={styles.marker}>
              {met ? "✓" : "○"}
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

const styles: Record<string, React.CSSProperties> = {
  list: {
    listStyle: "none",
    margin: "8px 0 0",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  item: {
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "color 0.15s ease",
  },
  marker: {
    width: 12,
    display: "inline-block",
    textAlign: "center",
  },
};
