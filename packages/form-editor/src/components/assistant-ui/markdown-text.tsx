"use client";

import { memo } from "react";
import { StreamdownTextPrimitive } from "@assistant-ui/react-streamdown";
import { code } from "@streamdown/code";

const plugins = { code };

const MarkdownTextImpl = () => (
  <StreamdownTextPrimitive
    plugins={plugins}
    shikiTheme={["github-light", "github-dark"]}
  />
);

export const MarkdownText = memo(MarkdownTextImpl);
