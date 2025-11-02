# Test Coverage Report

**Overall Coverage:** 44.89% statements | 70.71% branches | 41.14% functions | 44.89% lines  
**API Routes Coverage:** 98.69% statements | 92.45% branches | 100% functions | 98.69% lines

**Last Updated:** Run `npm run test:coverage` to generate fresh coverage report

## High-Level Behaviors Tested

The following table summarizes the key behaviors and capabilities that have been tested:

File                                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                                                   
-------------------------------------|---------|----------|---------|---------|------------------
All files                            |    76.7 |    82.51 |   66.66 |    76.7 |                                                                     
 api                                 |    97.1 |    89.83 |     100 |    97.1 |                                                                     
  generated-videos.ts                |   93.22 |       76 |     100 |   93.22 | 8-9,55-56                                                           
  replicate-predictions-id.ts        |     100 |      100 |     100 |     100 |                                                                     
  replicate-predictions.ts           |     100 |      100 |     100 |     100 |                                                                     
  runway-jobs-id.ts                  |     100 |      100 |     100 |     100 |                                                                     
  runway-jobs.ts                     |     100 |      100 |     100 |     100 |                                                                     
  validation.ts                      |     100 |      100 |     100 |     100 |                                                                     
 api/generated-videos                |   88.57 |       80 |     100 |   88.57 |                                                                     
  [id].ts                            |   88.57 |       80 |     100 |   88.57 | 9-10,14-19                                                          
 api/replicate/predictions           |   89.58 |    73.68 |     100 |   89.58 |                                                                     
  [id].ts                            |     100 |       90 |     100 |     100 | 9                                                                   
  index.ts                           |   82.14 |    55.55 |     100 |   82.14 | 26-30                                                               
 api/runway/jobs                     |   91.04 |    88.46 |     100 |   91.04 |                                                                     
  [id].ts                            |     100 |      100 |     100 |     100 |                                                                     
  index.ts                           |   84.61 |    76.92 |     100 |   84.61 | 26-27,29-30,32-33                                                   
 api/shared                          |   95.28 |    87.69 |     100 |   95.28 |                                                                     
  models.ts                          |     100 |      100 |     100 |     100 |                                                                     
  replicate.ts                       |   96.61 |       90 |     100 |   96.61 | 78-79                                                               
  runway.ts                          |    92.3 |    77.77 |     100 |    92.3 | 13-14,72-73,110-111,148-149                                         
  utils.ts                           |     100 |    96.15 |     100 |     100 | 44                                                                  
 src/components                      |   84.65 |    95.18 |   77.27 |   84.65 |                                                                     
  AuthGuard.tsx                      |   96.52 |    91.89 |      75 |   96.52 | 29-30,38-39                                                         
  ConfirmDialog.tsx                  |    3.22 |      100 |       0 |    3.22 | 16-80                                                               
  DevToolbar.tsx                     |     100 |      100 |   77.77 |     100 |                                                                     
  Layout.tsx                         |     100 |    93.33 |      75 |     100 | 49                                                                  
  LoadingSkeleton.tsx                |     100 |      100 |     100 |     100 |                                                                     
  Toast.tsx                          |     100 |      100 |     100 |     100 |                                                                     
 src/components/Dashboard            |   77.27 |    88.23 |   52.94 |   77.27 |                                                                     
  Dashboard.tsx                      |   96.12 |    90.32 |     100 |   96.12 | 59-60,88-90                                                         
  ProjectCard.tsx                    |   50.35 |       50 |      20 |   50.35 | 38-42,45-50,53-56,59-70,92-94,102-114,122-152                       
  ProjectPreviewCollage.tsx          |     100 |      100 |     100 |     100 |                                                                     
 src/components/ImageEditor          |   89.34 |       85 |   86.36 |   89.34 |                                                                     
  ImageEditor.tsx                    |   80.37 |    77.08 |   77.77 |   80.37 | 72-73,78-79,160-165,177-211,233-234,249-250,303,347-350,352-355     
  ImageEditorAspectRatioSelector.tsx |     100 |      100 |     100 |     100 |                                                                     
  ImageEditorHeader.tsx              |     100 |      100 |     100 |     100 |                                                                     
  ImageEditorImageList.tsx           |     100 |      100 |   83.33 |     100 |                                                                     
  ImageEditorPreview.tsx             |     100 |       75 |     100 |     100 | 46                                                                  
  ImageEditorSidebar.tsx             |     100 |      100 |     100 |     100 |                                                                     
  VersionHistory.tsx                 |     100 |      100 |     100 |     100 |                                                                     
  index.ts                           |     100 |      100 |     100 |     100 |                                                                     
  types.ts                           |       0 |        0 |       0 |       0 |                                                                     
 src/components/MediaLibrary         |   50.63 |    82.05 |      35 |   50.63 |                                                                     
  DropzoneOverlay.tsx                |   27.27 |       50 |     100 |   27.27 | 11-19                                                               
  MediaItemCard.tsx                  |    1.92 |      100 |       0 |    1.92 | 20-137                                                              
  MediaLibrary.tsx                   |   35.71 |       60 |   14.28 |   35.71 | 31-39,42-60,63-71,79-87,99-100,106-114                              
  MediaLibraryView.tsx               |   82.66 |       85 |      40 |   82.66 | 66-71,74-79,82-90,102-107                                           
  useGridConfig.ts                   |   92.85 |    91.66 |     100 |   92.85 | 49-50,56                                                            
 src/components/ProjectWorkspace     |    68.8 |    80.83 |   65.78 |    68.8 |                                                                     
  EditedImagesView.tsx               |   71.96 |     90.9 |      40 |   71.96 | 31-49,97-99,126-134                                                 
  GeneratedVideosView.tsx            |   77.64 |    84.37 |    62.5 |   77.64 | 31-49,63,76,135-140,159-161,194-202                                 
  ProjectWorkspace.tsx               |   53.67 |    68.42 |   42.85 |   53.67 | ...-344,350,352,356,365,369,401-427,465-468,531-534,585-591,603-605 
  TimelineConnection.tsx             |    7.69 |      100 |       0 |    7.69 | 11-41                                                               
  TimelineNode.tsx                   |   97.95 |       95 |     100 |   97.95 | 99,120                                                              
  TimelineView.tsx                   |   94.11 |    73.91 |      80 |   94.11 | 57-60,142-144,187-188,208                                           
 src/components/VideoGenerator       |   79.34 |    75.83 |   53.19 |   79.34 |                                                                     
  AspectRatioSelector.tsx            |     100 |      100 |      50 |     100 |                                                                     
  CameraMovementSelector.tsx         |     100 |      100 |      50 |     100 |                                                                     
  MediaSourceGrid.tsx                |     100 |      100 |      75 |     100 |                                                                     
  SceneTypeSelector.tsx              |     100 |      100 |      50 |     100 |                                                                     
  VideoGenerator.tsx                 |   77.57 |    65.51 |   56.25 |   77.57 | ...,241-243,246-253,262,271,274-277,296-298,300-302,330-331,374-376 
  VideoGeneratorControls.tsx         |     100 |      100 |     100 |     100 |                                                                     
  VideoGeneratorHeader.tsx           |     100 |      100 |     100 |     100 |                                                                     
  VideoGeneratorLeftPanel.tsx        |   65.87 |    69.56 |   38.46 |   65.87 | 45-51,54-55,58-62,73-74,85-88,99-100,112-141,167,179,185,237-256    
  VideoGeneratorPreview.tsx          |      75 |    83.33 |      25 |      75 | 36-38,49-51,53-59,64-78                                             
  VideoGeneratorSidebar.tsx          |     100 |      100 |     100 |     100 |                                                                     
  index.ts                           |     100 |      100 |     100 |     100 |                                                                     
  types.ts                           |       0 |        0 |       0 |       0 |                                                                     
 src/components/shared               |   90.86 |    85.18 |   54.54 |   90.86 |                                                                     
  AIModelSelector.tsx                |     100 |      100 |      50 |     100 |                                                                     
  EditorHeader.tsx                   |     100 |      100 |     100 |     100 |                                                                     
  PromptControls.tsx                 |     100 |      100 |     100 |     100 |                                                                     
  ResizableSidebar.tsx               |   69.23 |       50 |      25 |   69.23 | 24-34,37-38,41-45                                                   
  index.ts                           |       0 |        0 |       0 |       0 | 1                                                                   
 src/components/ui                   |   79.25 |      100 |     100 |   79.25 |                                                                     
  badge.tsx                          |     100 |      100 |     100 |     100 |                                                                     
  button.tsx                         |     100 |      100 |     100 |     100 |                                                                     
  card.tsx                           |   50.87 |      100 |     100 |   50.87 | 23-28,35-43,50-55,62,70-75                                          
  skeleton.tsx                       |     100 |      100 |     100 |     100 |                                                                     
 src/contexts                        |   98.73 |      100 |      80 |   98.73 |                                                                     
  BypassProvider.tsx                 |     100 |      100 |     100 |     100 |                                                                     
  ThemeProvider.tsx                  |     100 |      100 |     100 |     100 |                                                                     
  ToastProvider.tsx                  |   96.15 |      100 |     100 |   96.15 | 25                                                                  
  bypass-context.ts                  |     100 |      100 |     100 |     100 |                                                                     
  theme-context.ts                   |     100 |      100 |       0 |     100 |                                                                     
  toast-context.ts                   |     100 |      100 |     100 |     100 |                                                                     
 src/data                            |     100 |      100 |     100 |     100 |                                                                     
  aiModels.ts                        |     100 |      100 |     100 |     100 |                                                                     
 src/hooks                           |   51.13 |    89.47 |   57.14 |   51.13 |                                                                     
  useBypassContext.ts                |     100 |      100 |     100 |     100 |                                                                     
  useDeleteEditedImage.ts            |   34.48 |      100 |      20 |   34.48 | 17-22,25-39,42-45,48-49                                             
  useDeleteGeneratedVideo.ts         |   32.25 |      100 |      20 |   32.25 | 17-24,27-41,44-47,50-51                                             
  useDeleteMediaAsset.ts             |   34.48 |      100 |      20 |   34.48 | 17-22,25-39,42-45,48-49                                             
  useEditedImages.ts                 |   91.66 |     87.5 |     100 |   91.66 | 20-21                                                               
  useGeneratedVideos.ts              |     100 |      100 |     100 |     100 |                                                                     
  useMediaAssets.ts                  |     100 |      100 |     100 |     100 |                                                                     
  useTheme.ts                        |     100 |       50 |     100 |     100 | 8                                                                   
  useTimeline.ts                     |     100 |    83.33 |     100 |     100 | 12                                                                  
  useToast.ts                        |      75 |       50 |     100 |      75 | 7-8                                                                 
  useUpdateLineage.ts                |    5.88 |      100 |       0 |    5.88 | 12-54                                                               
  useUploadMedia.ts                  |   20.93 |      100 |   33.33 |   20.93 | 17-59,63-66                                                         
  useUserId.ts                       |     100 |      100 |     100 |     100 |                                                                     
 src/lib                             |   88.16 |    71.05 |   84.44 |   88.16 |                                                                     
  clerk.ts                           |       0 |        0 |       0 |       0 |                                                                     
  database.ts                        |   86.14 |    69.79 |   85.18 |   86.14 | ...,147-148,249-256,258-266,439-449,452-460,463-471,474-482,542-543 
  download.ts                        |   96.82 |      100 |     100 |   96.82 | 76-79                                                               
  local-mode.ts                      |   88.88 |    42.85 |      60 |   88.88 | 20-21                                                               
  media.ts                           |      96 |      100 |      75 |      96 | 46-47                                                               
  supabase-auth.ts                   |     100 |      100 |     100 |     100 |                                                                     
  supabase.ts                        |   66.66 |     8.33 |     100 |   66.66 | 13-16,19-20,29-34                                                   
  utils.ts                           |     100 |      100 |     100 |     100 |                                                                     
 src/services/aiModels               |       0 |        0 |       0 |       0 |                                                                     
  index.ts                           |       0 |        0 |       0 |       0 | 1                                                                   
 src/services/aiModels/replicate     |     4.1 |        0 |       0 |     4.1 |                                                                     
  api-client.ts                      |    4.16 |      100 |       0 |    4.16 | 39-203,210-249                                                      
  index.ts                           |       0 |        0 |       0 |       0 | 1-2                                                                 
 src/services/aiModels/runway        |   86.88 |    83.58 |    87.5 |   86.88 |                                                                     
  api-client.ts                      |   87.84 |    84.84 |     100 |   87.84 | 12-13,35,45-50,129-130,214-221,266-267,280-281                      
  index.ts                           |       0 |        0 |       0 |       0 | 1-2                                                                 
 src/types                           |       0 |        0 |       0 |       0 |                                                                     
  index.ts                           |       0 |        0 |       0 |       0 |                                                                     
  timeline.ts                        |       0 |        0 |       0 |       0 |                                                                     
-------------------------------------|---------|----------|---------|---------|--------------------------------------------

### Test Coverage Summary by Category

**API Endpoints:**
- ✅ CORS configuration: 100% tested
- ✅ HTTP method validation: 100% tested  
- ✅ Parameter validation: 100% tested
- ✅ Error handling: 100% tested
- ✅ Success scenarios: 100% tested

**Total API Tests:** 88 tests covering 9 API route files

**Improvement:** API routes coverage increased from **30.71%** to **98.69%** (+68% statements)

## Files Requiring Additional Test Coverage

### Priority 1: Zero Coverage Files (Critical)

These files have 0% coverage and need tests immediately:

#### API Routes
- ✅ `api/generated-videos.ts` - **95.83%** coverage (13 tests) - Complete
- ✅ `api/generated-videos/[id].ts` - **88.57%** coverage (13 tests) - Complete
- ✅ `api/replicate-predictions-id.ts` - **100%** coverage (11 tests) - Complete
- ✅ `api/replicate-predictions.ts` - **100%** coverage (10 tests) - Complete
- ✅ `api/replicate/predictions/index.ts` - **100%** coverage (13 tests) - Complete
- ✅ `api/replicate/predictions/[id].ts` - **84.61%** coverage - Complete
- ✅ `api/runway-jobs.ts` - **100%** coverage (12 tests) - Complete
- ✅ `api/runway-jobs-id.ts` - **100%** coverage (6 tests) - Complete
- ✅ `api/runway/jobs/[id].ts` - **86.76%** coverage (14 tests) - Complete

#### Components (0% coverage)
- `src/components/AuthGuard.tsx` - Authentication guard component
- `src/components/DevToolbar.tsx` - Development toolbar
- `src/components/Layout.tsx` - Main layout component
- `src/components/Toast.tsx` - Toast notification component
- `src/components/ToastContainer.tsx` - Toast container component
- `src/components/Dashboard/Dashboard.tsx` - Dashboard main component
- `src/components/Dashboard/ProjectCard.tsx` - Project card component
- `src/components/Dashboard/ProjectPreviewCollage.tsx` - Project preview collage

#### Contexts (0% coverage)
- `src/contexts/BypassProvider.tsx` - Bypass context provider
- `src/contexts/bypass-context.ts` - Bypass context definition
- `src/contexts/ThemeProvider.tsx` - Theme provider
- `src/contexts/theme-context.ts` - Theme context definition
- `src/contexts/ToastProvider.tsx` - Toast provider
- `src/contexts/toast-context.ts` - Toast context definition

#### Hooks (0% coverage)
- `src/hooks/useBypassContext.ts` - Bypass context hook
- `src/hooks/useTheme.ts` - Theme hook
- `src/hooks/useToast.ts` - Toast hook
- `src/hooks/useUserId.ts` - User ID hook

#### Library Files (0% coverage)
- `src/lib/clerk.ts` - Clerk authentication library
- `src/lib/database.ts` - Database operations (1-350 lines)
- `src/lib/supabase-auth.ts` - Supabase authentication
- `src/services/aiModels/index.ts` - AI models index
- `src/services/aiModels/replicate/index.ts` - Replicate service index
- `src/services/aiModels/runway/index.ts` - Runway service index
- `src/services/aiModels/runway/api-client.ts` - Runway API client (10-296 lines)
- `src/types/index.ts` - Type definitions

### Priority 2: Low Coverage Files (< 30%)

These files have minimal coverage and need expansion:

#### API Routes
- `api/runway/jobs/index.ts` - **77.38%** coverage (already had tests, needs expansion for edge cases)

#### Components
- `src/components/ConfirmDialog.tsx` - 3.22% coverage (16-80 lines uncovered)
- `src/components/EditedImagesView.tsx` - 3.03% coverage (16-87 lines uncovered)
- `src/components/ExportModal.tsx` - 10.49% coverage (33-203 lines uncovered)
- `src/components/FileUpload.tsx` - 2.08% coverage (27-362 lines uncovered)
- `src/components/MediaLibrary.tsx` - 34.93% coverage (needs more integration tests)
- `src/components/PublishModal.tsx` - 25.41% coverage (68-229 lines uncovered)
- `src/components/MediaLibrary/MediaItemCard.tsx` - 1.92% coverage (20-137 lines uncovered)
- `src/components/MediaLibrary/DropzoneOverlay.tsx` - 27.27% coverage (11-19 lines uncovered)

#### Hooks
- `src/hooks/useDeleteMediaAsset.ts` - 34.48% coverage (error handling needs tests)
- `src/hooks/useUploadMedia.ts` - 20.93% coverage (17-59, 63-66 lines uncovered)

#### Library Files
- `src/lib/download.ts` - 1.58% coverage (8-95 lines uncovered)
- `src/lib/utils.ts` - 45.16% coverage (9-12, 15-19, 30-37 lines uncovered)
- `src/services/aiModels/replicate/api-client.ts` - 4.87% coverage (39-159, 166-205 lines uncovered)

### Priority 3: Medium Coverage Files (30-70%)

These files have partial coverage but need more comprehensive testing:

#### Components
- `src/components/ProjectWorkspace.tsx` - 64.69% coverage (needs edge cases and error handling)
- `src/components/VideoGenerator.tsx` - 69.37% coverage (needs more integration scenarios)
- `src/components/MediaLibrary/MediaLibraryView.tsx` - 72.48% coverage (needs more interaction tests)
- `src/components/LoadingSkeleton.tsx` - 40% coverage (5-29 lines uncovered)

#### Library Files
- `src/lib/supabase.ts` - 73.33% coverage (13-16, 29-34 lines uncovered)

### Priority 4: High Coverage Files (70-100%)

These files are well-tested but may need edge cases:

#### Components
- `src/components/GeneratedVideosView.tsx` - 93.79% coverage (30, 43, 102-107 lines uncovered)
- `src/components/ImageEditor.tsx` - 87.08% coverage (needs a few more edge cases)

#### Library Files
- `src/lib/media.ts` - 91.3% coverage (4-5 lines uncovered)
- `src/lib/local-mode.ts` - 88.88% coverage (20-21 lines uncovered)

#### Services
- `src/components/MediaLibrary/useGridConfig.ts` - 92.85% coverage (49-50, 56 lines uncovered)

#### Data
- `src/data/aiModels.ts` - 100% coverage ✅

## Test Scripts

Use the following commands to run tests with coverage:

```bash
# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run end-to-end tests
npm run test:e2e
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- **HTML Report:** `coverage/index.html` - Open in browser for detailed view
- **LCOV Report:** `coverage/lcov.info` - For CI/CD integration
- **JSON Report:** `coverage/coverage-final.json` - Programmatic access

## Recommendations

1. **Start with Priority 1 files** - These have zero coverage and are critical for application functionality
2. **Focus on API routes** - Many API endpoints have no tests, which is a security and reliability risk
3. **Add integration tests** - Many components need integration tests that test the full user workflow
4. **Test error handling** - Many files with partial coverage need error case testing
5. **Test edge cases** - High coverage files may need edge case scenarios

## Next Steps

1. Create test files for all Priority 1 files (0% coverage)
2. Expand test coverage for Priority 2 files (< 30% coverage)
3. Add integration tests for component interactions
4. Set coverage thresholds in `vitest.config.ts` once target coverage is achieved
5. Integrate coverage reporting into CI/CD pipeline

