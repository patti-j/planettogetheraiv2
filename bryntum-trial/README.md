# Upload Bryntum Trial Files Here

## Upload Structure Needed:

```
bryntum-trial/
├── build/                    ← Upload entire build folder from trial
│   ├── gantt.module.js      ← Main library file
│   ├── gantt.stockholm.css  ← Default theme
│   └── ...other files
└── lib/                     ← Upload gantt-react folder as 'lib'
    ├── BryntumGantt.js     ← React wrapper
    └── ...other React files
```

## How to Upload:

1. **From your downloaded trial ZIP**, extract it
2. **Drag the entire `build` folder** into this `bryntum-trial` directory
3. **From the trial's `lib` folder**, drag the `gantt-react` folder here and rename it to `lib`

The structure should match exactly as shown above for the integration to work.