<!-- 5c0aded7-72df-406e-8f50-092d4da6b835 be77beba-3c1c-41b5-bf15-afbcb12cbefe -->
# Targeted memoization plan

## Scope

- Stabilize handler props (useCallback) and derived values (useMemo)
- Memo-wrap heavy child components
- Refactor hot paths to avoid per-render function/object creation

## Changes by file

### App

- useCallback: view navigation handlers
```16:35:src/App.tsx
// handleSelectProject, handleBackToDashboard, handleEditImage, handleUpdateProject
```


### components/Dashboard.tsx

- No need to memoize `loadProjects` in current form (single-run effect, not passed down)
```41:50:src/components/Dashboard.tsx
const createProject = async () => { /* ... */ } // will become useCallback
```

- useCallback: `createProject`, `deleteProject`
- Refactor `ProjectCard` API to accept ids; move inline lambdas out (then memoize handlers)
- React.memo: `ProjectCard`

### components/ProjectWorkspace.tsx

- useCallback: `loadProjectData`, name edit handlers
```85:103:src/components/ProjectWorkspace.tsx
const loadProjectData = async () => { /* ... */ }
```

- useMemo: `tabs`
- useCallback: inline props for `EditedImagesView`, `GeneratedVideosView`, `FileUpload` handlers
- React.memo: `EditedImagesView`, `GeneratedVideosView`, `MediaLibrary` (once props stabilized)

### components/MediaLibrary.tsx

- useCallback: `loadAssets`, `confirmDeleteAsset`, upload/drag handlers
```31:44:src/components/MediaLibrary.tsx
useEffect(() => { loadAssets(); }, [projectId, onRefresh])
```


### components/FileUpload.tsx

- useCallback: `handleFiles`, drag/drop, `removeFile`, `startUpload`

### components/ImageEditor.tsx

- useMemo: `selectedModelInfo`
- useCallback: `handleGenerate`, `handleSave`

### components/ExportModal.tsx

- useMemo: `formats`
- useCallback: `handleExport`

### components/PublishModal.tsx

- useMemo: `availablePlatforms`, `selectedPlatformInfo`
- useCallback: `handlePublish`

### components/VideoGenerator.tsx

- useCallback: `loadSources`, drag/selection handlers
- useMemo: `selectedModelInfo`, `canGenerate`

### components/Layout.tsx

- useCallback: `onSignOut` (wrap inline), keep user projection simple

## Measurement

- Add a profiling checklist: use React DevTools Profiler and “Highlight updates” to verify reduced renders.

## Notes

- Only memoize where identities are used by children or dependencies; avoid overuse.
- `Dashboard.loadProjects`: no benefit to memoization currently; inline body inside `useEffect` or keep as is.

### To-dos

- [ ] Memoize App view handlers with useCallback
- [ ] Memoize Dashboard handlers; refactor ProjectCard props
- [ ] Memoize ProjectWorkspace handlers and tabs; memo-wrap children
- [ ] Memoize MediaLibrary loaders and drag/upload handlers
- [ ] Memoize FileUpload handlers and startUpload
- [ ] useMemo selectedModelInfo; memoize generate/save
- [ ] Memo formats and handleExport
- [ ] Memo availablePlatforms/selectedPlatformInfo; callback
- [ ] Memo loadSources, selection/drag handlers, selectedModelInfo
- [ ] Memoize onSignOut in Layout
- [ ] Run React Profiler, verify reduced re-renders