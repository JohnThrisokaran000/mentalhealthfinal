"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { translate, type Language } from "@/lib/i18n";

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const ATTRIBUTES = ["aria-label", "placeholder", "title"];

function applyTranslation(root: Node, language: Language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node as Text;
    if (!originalText.has(text)) originalText.set(text, text.nodeValue ?? "");
    const source = originalText.get(text) ?? "";
    const leading = source.match(/^\s*/)?.[0] ?? "";
    const trailing = source.match(/\s*$/)?.[0] ?? "";
    const core = source.slice(leading.length, source.length - trailing.length || undefined);
    text.nodeValue = `${leading}${translate(core, language)}${trailing}`;
  }

  const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll("*"))] : Array.from((root as Document).querySelectorAll("*"));
  for (const element of elements) {
    for (const attribute of ATTRIBUTES) {
      const value = element.getAttribute(attribute);
      if (value === null) continue;
      let originals = originalAttributes.get(element);
      if (!originals) { originals = new Map(); originalAttributes.set(element, originals); }
      if (!originals.has(attribute)) originals.set(attribute, value);
      element.setAttribute(attribute, translate(originals.get(attribute) ?? value, language));
    }
  }
}

export function HindiTranslationLayer() {
  const language = useApp((state) => state.language);
  const setLanguage = useApp((state) => state.setLanguage);

  useEffect(() => {
    const saved = localStorage.getItem("sentinel:language");
    if (saved === "en" || saved === "hi") setLanguage(saved);
  }, [setLanguage]);

  useEffect(() => {
    document.documentElement.lang = language === "hi" ? "hi" : "en";
  }, [language]);

  useEffect(() => {
    applyTranslation(document.body, language);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const added of Array.from(mutation.addedNodes)) applyTranslation(added, language);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  return null;
}
