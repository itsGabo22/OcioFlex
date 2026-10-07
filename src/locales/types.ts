export type Translations = {
  common: {
    today: string;
    startSession: string;
    pause: string;
    endSession: string;
    resume: string;
    remaining: string;
    completed: string;
    active: string;
    sysOk: string;
    target: string;
    baseline: string;
    allowance: string;
    alloc: string;
  };
  navigation: {
    deepWork: string;
    entertainment: string;
    dashboard: string;
    contextRules: string;
    analyticsLog: string;
    settings: string;
    workspaceEngine: string;
    nodes: string;
    switchMode: string;
    toggleMode: string;
  };
  dashboard: {
    overview: string;
    alignment: string;
    focusSession: string;
    efficiencyScore: string;
    ocioCooldown: string;
    memoryCoreRes: string;
    systemTelemetry: string;
    realTimeSync: string;
    activityIntensity: string;
    trailingDays: string;
  };
  deepWork: {
    focusSessionActive: string;
    currentTask: string;
    timeRemaining: string;
    dailyTimeline: string;
    sessionHistory: string;
    noSessionsYet: string;
  };
  entertainment: {
    ocioCooldownActive: string;
    cooldownMetrics: string;
    energyRecovered: string;
    stressRelieved: string;
    mediaQuickLaunch: string;
    entertainmentHub: string;
    starting: string;
  };
  settings: {
    title: string;
    language: string;
    theme: string;
    spanish: string;
    english: string;
    foco: string;
    ocio: string;
  };
  feedback: {
    featureUnavailable: string;
    sessionStarted: string;
    sessionEnded: string;
    sessionPaused: string;
    sessionResumed: string;
  };
};
