/**
 * Reviewer Dashboard
 * 
 * Displays pending submissions awaiting approval for the current user.
 * Provides quick approve/reject actions with approval dialog integration.
 * 
 * Based on INT.DOC.40 Section 4.1 (Preventive Controls - Approval workflows)
 */

import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

export default function ReviewerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    action: "approve" | "reject" | null;
    submission: any;
  }>({ open: false, action: null, submission: null });

  // Fetch pending reviews for current user
  const {
    data: pendingReviews,
    isLoading,
    refetch,
  } = trpc.approval.getMyPendingReviews.useQuery(undefined, {
    enabled: !!user,
  });

  // Approve submission mutation
  const approveMutation = trpc.approval.approveSubmission.useMutation({
    onSuccess: () => {
      toast.success("Submission approved successfully");
      refetch();
      setApprovalDialog({ open: false, action: null, submission: null });
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  // Reject submission mutation
  const rejectMutation = trpc.approval.rejectSubmission.useMutation({
    onSuccess: () => {
      toast.success("Submission rejected");
      refetch();
      setApprovalDialog({ open: false, action: null, submission: null });
    },
    onError: (error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });

  // Flag for review mutation
  const flagForReviewMutation = trpc.approval.flagForReview.useMutation({
    onSuccess: () => {
      toast.success("Submission flagged for review");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to flag: ${error.message}`);
    },
  });

  const handleApprove = (submission: any, notes?: string) => {
    approveMutation.mutate({
      partnerQuestionnaireId: submission.id,
      notes,
    });
  };

  const handleReject = (submission: any, notes: string) => {
    rejectMutation.mutate({
      partnerQuestionnaireId: submission.id,
      notes,
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access the reviewer dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check if user has reviewer permissions
  const hasReviewerRole =
    user.role === "admin" ||
    user.role === "enterprise_owner" ||
    user.role === "compliance_officer";

  if (!hasReviewerRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You do not have permission to review submissions. Only compliance officers,
              enterprise owners, and administrators can access this dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Reviewer Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve pending questionnaire submissions
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Reviews
              </CardTitle>
              <Clock className="w-4 h-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReviews?.length || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting your approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Your Role
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {user.role.replace("_", " ")}
              </div>
              <p className="text-xs text-gray-500 mt-1">Approval authority</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Enterprise
              </CardTitle>
              <AlertCircle className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user.enterpriseId ? `ID: ${user.enterpriseId}` : "All"}
              </div>
              <p className="text-xs text-gray-500 mt-1">Scope of authority</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Submissions</CardTitle>
            <CardDescription>
              Questionnaire submissions flagged for review and awaiting approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!pendingReviews || pendingReviews.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  All Caught Up!
                </h3>
                <p className="text-gray-600">
                  There are no pending submissions awaiting your review at this time.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Partner
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Touchpoint
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingReviews.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {submission.partnerName}
                          </div>
                          <div className="text-xs text-gray-500">
                            Code: {submission.accessCode}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {submission.protocolName}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {submission.touchpointTitle}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.completedDate
                            ? new Date(submission.completedDate).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {submission.reviewStatus || "Pending"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() =>
                                setApprovalDialog({
                                  open: true,
                                  action: "approve",
                                  submission,
                                })
                              }
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() =>
                                setApprovalDialog({
                                  open: true,
                                  action: "reject",
                                  submission,
                                })
                              }
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approval Dialog */}
      {approvalDialog.open && approvalDialog.submission && (
        <ApprovalDialog
          open={approvalDialog.open}
          action={approvalDialog.action!}
          submission={approvalDialog.submission}
          onClose={() => setApprovalDialog({ open: false, action: null, submission: null })}
          onConfirm={(notes) => {
            if (approvalDialog.action === "approve") {
              handleApprove(approvalDialog.submission, notes);
            } else if (approvalDialog.action === "reject") {
              handleReject(approvalDialog.submission, notes);
            }
          }}
          isLoading={approveMutation.isPending || rejectMutation.isPending}
        />
      )}
    </div>
  );
}

// Approval Dialog Component
interface ApprovalDialogProps {
  open: boolean;
  action: "approve" | "reject";
  submission: any;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  isLoading?: boolean;
}

function ApprovalDialog({
  open,
  action,
  submission,
  onClose,
  onConfirm,
  isLoading,
}: ApprovalDialogProps) {
  const [notes, setNotes] = React.useState("");

  const getTitle = () => {
    return action === "approve" ? "Approve Submission" : "Reject Submission";
  };

  const getDescription = () => {
    const partnerName = submission?.partnerName || "this partner";
    if (action === "approve") {
      return `Approve ${partnerName}'s questionnaire submission. This will update the compliance status and notify the supplier.`;
    } else {
      return `Reject ${partnerName}'s questionnaire submission. You must provide a reason for rejection.`;
    }
  };

  const requiresNotes = action === "reject";
  const canSubmit = !requiresNotes || notes.trim().length > 0;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">{getTitle()}</h2>
          <p className="text-sm text-gray-600 mt-2">{getDescription()}</p>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
            <p className="text-sm font-medium text-gray-700">Submission Details:</p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>
                <strong>Partner:</strong> {submission.partnerName}
              </li>
              <li>
                <strong>Campaign:</strong> {submission.protocolName}
              </li>
              <li>
                <strong>Touchpoint:</strong> {submission.touchpointTitle}
              </li>
              <li>
                <strong>Submitted:</strong>{" "}
                {submission.completedDate
                  ? new Date(submission.completedDate).toLocaleDateString()
                  : "N/A"}
              </li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {requiresNotes ? "Rejection Reason (Required)" : "Notes (Optional)"}
            </label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder={
                requiresNotes
                  ? "Explain why this submission is being rejected..."
                  : "Add any comments or notes..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
            />
            {requiresNotes && notes.trim().length === 0 && (
              <p className="text-xs text-red-600 mt-1">Rejection notes are required</p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => canSubmit && onConfirm(notes)}
            disabled={!canSubmit || isLoading}
            className={
              action === "approve"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {action === "approve" ? "Approve" : "Reject"}
          </Button>
        </div>
      </div>
    </div>
  );
}
