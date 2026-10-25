import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { logout, User } from "../slices/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_API_URL || "http://localhost:3001/api",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    // A per-request authorization header wins (password recovery uses a
    // one-off reset token instead of the session token).
    if (token && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

/**
 * Endpoints authenticated by a one-off token instead of the session. A 401
 * from these means "this reset link is spent", not "your session is over",
 * so they must never sign the user out.
 */
const ONE_OFF_TOKEN_URLS = ['/users/forget-reset'];

const urlOf = (args: string | FetchArgs): string =>
  typeof args === 'string' ? args : args?.url || '';

/**
 * Wraps fetchBaseQuery: when the session itself is rejected (401) the session
 * is dead, so we sign out and drop every cached query instead of letting
 * components spin forever.
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    const hasSession = Boolean((api.getState() as RootState).auth.token);
    const usedOneOffToken = ONE_OFF_TOKEN_URLS.includes(urlOf(args));
    if (hasSession && !usedOneOffToken) {
      api.dispatch(logout());
      api.dispatch(apiSlice.util.resetApiState());
    }
  }
  return result;
};

/** Amounts recorded in one currency (never added to the other). */
export interface CurrencySlice {
  earned: number;
  paid: number;
  pending: number;
}

/** Per-currency breakdown returned alongside the legacy USD totals. */
export interface CurrencyTotals {
  usd: CurrencySlice;
  irr: CurrencySlice;
}

export interface TimeSummary {
  totalHours: number;
  /** @deprecated USD-only legacy total - use currencyTotals. */
  totalAmount: number;
  /** @deprecated USD-only legacy total - use currencyTotals. */
  paidAmount: number;
  /** @deprecated USD-only legacy total - use currencyTotals. */
  pendingAmount: number;
  currencyTotals?: CurrencyTotals;
  entryCount: number;
  days: { date: string; hours: number; amount: number; entries: number }[];
}

export interface ReportRow {
  userId: string;
  username: string;
  email: string;
  totalHours: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "Underpaid" | "Overpaid" | "Exact";
}

export interface SearchResult {
  title: string | null;
  url: string;
  author: string | null;
  publishedDate: string | null;
  highlights: string[];
}

export interface SearchResponse {
  success: boolean;
  data: { query: string; results: SearchResult[] };
}

export interface GroupReport {
  group: string;
  hourlyRate: number;
  hourlyRateCurrency: "usd" | "irr";
  /** Alias of hourlyRateCurrency for older payloads. */
  currency?: "usd" | "irr";
  budget: number;
  startDate: string;
  endDate: string;
  totals: {
    totalHours: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  };
  reports: ReportRow[];
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User", "Group", "TimeLog", "Payment", "Invitation", "Summary"],
  endpoints: (builder) => ({
    // ---- Auth ----
    login: builder.mutation<
      { token: string; data: { user: User } },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: "/users/login",
        method: "POST",
        body: credentials,
      }),
    }),
    register: builder.mutation<
      { token: string; data: { user: User } },
      {
        username: string;
        email: string;
        password: string;
        personalRate: number;
        personalRateCurrency?: "usd" | "irr";
      }
    >({
      query: (userData) => ({
        url: "/users/register",
        method: "POST",
        body: userData,
      }),
    }),
    getMe: builder.query<{ data: { user: User } }, void>({
      query: () => "/users/me",
      providesTags: ["User"],
    }),
    updateMe: builder.mutation<
      { data: { user: User } },
      Partial<User> & { personalRateCurrency?: "usd" | "irr" }
    >({
      query: (data) => ({ url: "/users/me", method: "PATCH", body: data }),
      invalidatesTags: ["User"],
    }),

    // ---- Invitations ----
    getMyInvitations: builder.query<{ data: { invitations: any[] } }, void>({
      query: () => "/users/invitations",
      providesTags: ["Invitation"],
    }),
    handleInvitation: builder.mutation<
      unknown,
      { invitationId: string; status: "accepted" | "declined" }
    >({
      query: (body) => ({
        url: "/groups/invitation/handle",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Invitation", "Group"],
    }),

    // ---- Time ----
    getTimeLogs: builder.query<
      { data: any[]; count: number },
      Record<string, string>
    >({
      query: (params = {}) => ({ url: "/time/logs", params: params || {} }),
      providesTags: ["TimeLog"],
    }),
    addTimeLog: builder.mutation<
      unknown,
      { date: string; hours: number; groupId?: string | null }
    >({
      query: (log) => ({ url: "/time/logs", method: "POST", body: log }),
      invalidatesTags: ["TimeLog", "Summary", "Group"],
    }),
    deleteTimeLog: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/time/logs?id=${id}`, method: "DELETE" }),
      invalidatesTags: ["TimeLog", "Summary"],
    }),
    getTimeSummary: builder.query<
      TimeSummary,
      { startDate?: string; endDate?: string }
    >({
      query: (params = {}) => ({ url: "/time/summary", params: params || {} }),
      transformResponse: (res: { success: boolean; data: TimeSummary }) =>
        res.data,
      providesTags: ["Summary"],
    }),
    getEarnings: builder.query<
      {
        data: {
          totalEarnings: number;
          totalHours: number;
          paidAmount: number;
          pendingAmount: number;
        };
      },
      { month: number; year: number }
    >({
      query: ({ month, year }) => `/time/earnings?month=${month}&year=${year}`,
      providesTags: ["Summary"],
    }),

    // ---- Groups ----
    getMyGroups: builder.query<{ data: any[] }, void>({
      query: () => ({ url: "/groups/my-groups" }),
      providesTags: ["Group"],
    }),
    createGroup: builder.mutation<
      { data: { group: any } },
      {
        name: string;
        hourlyRate: number;
        hourlyRateCurrency?: "usd" | "irr";
        budget?: number;
      }
    >({
      query: (group) => ({ url: "/groups", method: "POST", body: group }),
      invalidatesTags: ["Group"],
    }),
    getGroupDetails: builder.query<
      { data: { group: any; isManager?: boolean } },
      string
    >({
      query: (id) => `/groups/${id}`,
      providesTags: ["Group"],
    }),
    updateGroup: builder.mutation<
      { data: { group: any } },
      {
        id: string;
        name?: string;
        hourlyRate?: number;
        hourlyRateCurrency?: "usd" | "irr";
        budget?: number;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/groups/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Group"],
    }),
    inviteUser: builder.mutation<unknown, { email: string; groupId: string }>({
      query: (invite) => ({
        url: "/groups/invite",
        method: "POST",
        body: invite,
      }),
      invalidatesTags: ["Invitation"],
    }),
    getGroupMembers: builder.query<
      { data: { members: any[]; manager?: string; isManager?: boolean } },
      string
    >({
      query: (id) => `/groups/${id}/members`,
      providesTags: ["Group"],
    }),
    removeGroupMember: builder.mutation<
      { success: boolean },
      { id: string; userId: string }
    >({
      query: ({ id, userId }) => ({
        url: `/groups/${id}/members/${userId}`,
        method: "DELETE",
      }),
      // Removing a member changes the report rows too, not just group tags.
      invalidatesTags: ["Group", "Invitation", "TimeLog", "Payment"],
    }),
    getGroupInvitations: builder.query<
      { data: { invitations: any[] } },
      string
    >({
      query: (id) => `/groups/${id}/invitations`,
      providesTags: ["Invitation"],
    }),
    cancelInvitation: builder.mutation<
      { success: boolean },
      { id: string; invitationId: string }
    >({
      query: ({ id, invitationId }) => ({
        url: `/groups/${id}/invitations/${invitationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Invitation"],
    }),
    getGroupReport: builder.query<
      { success: boolean; data: GroupReport },
      { id: string; startDate: string; endDate: string }
    >({
      query: ({ id, startDate, endDate }) =>
        `/groups/${id}/report?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ["TimeLog", "Payment"],
    }),

    // ---- Web search (Exa, server-side) ----
    searchWeb: builder.mutation<SearchResponse, { q: string }>({
      query: ({ q }) => ({ url: "/search", params: { q } }),
    }),

    // -----change pass -----

    changePassword: builder.mutation<
      { success?: boolean; message?: string },
      {
        currentPassword: string;
        newPassword: string;
      }
    >({
      query: ({ currentPassword, newPassword }) => ({
        url: "/users/change-password",
        method: "PATCH",
        body: {
          currentPassword,
          newPassword,
        },
      }),
    }),

    // -----forgot pass -----

    /** Step 1: ask the API to mail a recovery code. */
    sendForgetCode: builder.mutation<
      { success?: boolean; message?: string; data?: { code: string } },
      { email: string }
    >({
      query: ({ email }) => ({
        url: "/users/send-forget",
        method: "POST",
        body: { email },
      }),
    }),

    /** Step 2: exchange the recovery code for a short-lived reset token. */
    checkForgetCode: builder.mutation<
      { success?: boolean; message?: string; data?: { token: string } },
      { email: string; code: string }
    >({
      query: ({ email, code }) => ({
        url: "/users/forget-check",
        method: "POST",
        body: { email, code },
      }),
    }),

    /** Step 3: set the new password with the reset token. */
    resetPassword: builder.mutation<
      { success?: boolean; message?: string; data?: { token: string } },
      { email: string; newPassword: string; token: string }
    >({
      query: ({ email, newPassword, token }) => ({
        url: "/users/forget-reset",
        method: "POST",
        body: { email, newPassword },
        headers: { authorization: `Bearer ${token}` },
      }),
    }),

    // ---- Payments ----
    getMyPayments: builder.query<
      {
        data: {
          payments: any[];
          total: number;
          totals?: { usd: number; irr: number };
        };
      },
      { startDate?: string; endDate?: string }
    >({
      query: (params = {}) => ({
        url: "/payments/my-payments",
        params: params || {},
      }),
      providesTags: ["Payment"],
    }),
    makePayment: builder.mutation<
      { data: { settledLogs: number; leftover: number } },
      {
        userId: string;
        amount: number;
        groupId?: string;
        startDate?: string;
        endDate?: string;
        notes?: string;
      }
    >({
      query: (payment) => ({
        url: "/payments/pay",
        method: "POST",
        body: payment,
      }),
      invalidatesTags: ["Payment", "TimeLog", "Summary", "Group"],
    }),
    getGroupPayments: builder.query<
      {
        data: {
          payments: any[];
          total: number;
          totals?: { usd: number; irr: number };
          currency?: "usd" | "irr";
        };
      },
      { groupId: string; startDate?: string; endDate?: string }
    >({
      query: ({ groupId, ...params }) => ({
        url: `/payments/group/${groupId}`,
        params,
      }),
      providesTags: ["Payment"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useGetMyInvitationsQuery,
  useHandleInvitationMutation,
  useGetTimeLogsQuery,
  useAddTimeLogMutation,
  useDeleteTimeLogMutation,
  useGetTimeSummaryQuery,
  useGetEarningsQuery,
  useGetMyGroupsQuery,
  useCreateGroupMutation,
  useGetGroupDetailsQuery,
  useUpdateGroupMutation,
  useInviteUserMutation,
  useGetGroupMembersQuery,
  useRemoveGroupMemberMutation,
  useGetGroupInvitationsQuery,
  useCancelInvitationMutation,
  useGetGroupReportQuery,
  useGetMyPaymentsQuery,
  useMakePaymentMutation,
  useGetGroupPaymentsQuery,
  useSearchWebMutation,
  useChangePasswordMutation,
  useSendForgetCodeMutation,
  useCheckForgetCodeMutation,
  useResetPasswordMutation,
} = apiSlice;
