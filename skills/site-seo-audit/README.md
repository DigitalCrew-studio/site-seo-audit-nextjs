# SEO Audit Skill v4

This package is a modular SEO audit skill.

Use it as:

```txt
seo-audit-skill-v4/
  SKILL.md
  references/
    *.md
```

The main `SKILL.md` is the controller. It tells the model when to use the skill, what inputs to request, which references to read, and how to produce the audit report.

The `references/` files contain detailed procedures. They should be opened only when relevant to the audit scope.

Core design:

- evidence-first;
- progressive disclosure;
- no invented data;
- clear priority model;
- technical SEO + content + rendering + performance + links + local/entity + GEO + analytics.
