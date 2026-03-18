# Garden for Life — Assessment Document Library

This folder contains **all reference documents** used by the GFL Assessment system.
The future API agent will consume these files to compute personalized archetype results.

## Folder Structure

```
assessment/
├── README.md                  ← You are here
├── index.js                   ← Barrel export for all assessment document modules
│
├── questions/
│   ├── index.js               ← All 36 questions (5 layers, 6 answers each, 72 picks)
│   └── questionSchema.js      ← Question/answer structure definition
│
├── archetypes/
│   ├── index.js               ← All archetype definitions & scoring rules
│   └── archetypeSchema.js     ← Archetype data structure
│
├── layers/
│   └── index.js               ← Layer metadata (names, colors, elements, shadow themes)
│
├── scoring/
│   └── index.js               ← Scoring algorithm, trait mapping, subgroup formulas
│
├── analysis/
│   └── templates.js           ← Analysis text templates per archetype/layer combo
│
└── research/
    └── README.md              ← Index of source materials & research papers
```

## How the API Agent Will Use These Documents

1. **Questions** are served to the user through AssessmentCard components
2. **User answers** (layerAnswers object) are sent to the API agent
3. The agent cross-references answers against **archetypes** and **scoring rules**
4. **Analysis templates** are used as seed text that the agent personalizes
5. The final result (archetype, radar data, subgroups, analysis) is returned

## Adding New Documents

Place research PDFs, papers, or reference material in `research/`.
Update `research/README.md` with a description of each document.
All JS modules re-export through `index.js` at each level.
