import { app } from "./firebase";

export const db = app.firestore();

// COLLECTION NAMES
export const COMPLETION_REQUESTS = "completionRequests";
export const SHARED_COMPLETION_REQUESTS = "sharedCompletionRequest";

// DOCUMENT SCHEMAS
export interface GPTSettings {
  frequencyPenalty: number;
  languageEngine: string;
  maxTokens: number;
  presencePenalty: number;
  stop: string;
  temperature: number;
}

export interface Annotations {
  note: string;
}

export interface CompletionRequest {
  id?: string;
  createdAt: any;
  output: any;
  prompt: string;
  settings: GPTSettings;
  userId: string;

  annotations?: Annotations;
  sharedId?: string;
}

export interface SharedCompletionRequest {
  id?: string;
  output: any;
  prompt: string;
  settings: GPTSettings;

  annotations?: Annotations;
}

export const shareCompletionRequest = async (
  id: string,
  data: SharedCompletionRequest
) => {
  const saveShareRes = await db
    .collection(SHARED_COMPLETION_REQUESTS)
    .add(data);

  await db
    .collection(COMPLETION_REQUESTS)
    .doc(id)
    .set({ sharedId: saveShareRes.id }, { merge: true });

  return saveShareRes.id;
};

export default db;
