export const APP_VERSION = 'v1.03';

export const RELEASES = [
  {
    version: 'v1.03',
    date: '2025-12-29',
    title: 'Cross-User Testing & UI Polish',
    items: [
      'Cross-user tests: tests can now include skis from multiple users and are stored in each involved user’s test results.',
      'Cross-test metadata + UI: results are tagged and shown with a cross-user pill and per-ski owner badges.',
      'Selection improvements: ski selection works across multiple users using stable composite keys (prevents ID collisions).',
      'Table view updates: selection/expansion/actions now respect multi-owner skis shown in the list.',
      'Filter drawer styling: filter drawers now match the app’s card styling and standard buttons.',
      'Sharing UX: share code is hidden by default with a toggle',
      'Sharing UX: user picker indicates read vs write access.',
    ],
  },
  {
    version: 'v1.02',
    date: '2025-12-27',
    title: 'Advanced Sharing & Summary Improvements',
    items: [
      'Added write share access: owners can now grant write permission to shared users, allowing them to perform tests.',
      'Improved sharing management: clearer UI for pending requests, access levels, and revoking access.',
      'New homepage styling and icon',
      'Minor bug fixes and UI polish.',
    ],
  },

  {
    version: 'v1.01',
    date: '2025-11-03',
    title: 'New features',
    items: [
      'Users can now share and get insight into another user’s skis and results from the [/sharing](/sharing) page',
      'Bug fixes and performance improvements',
    ],
  },
  {
    version: 'v1.00',
    date: '2025-10-01',
    title: 'Initial release',
    items: [
      'First public launch',
      'Ski-Lab core features',
    ],
  },
];