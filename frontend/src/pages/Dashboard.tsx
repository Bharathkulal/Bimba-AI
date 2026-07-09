import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, AlertCircle, Award } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Manage your resumes and check their performance"
        action={
          <Button onClick={() => navigate('/resume-builder')} variant="primary" className="gap-2">
            <Plus size={16} /> Create Resume
          </Button>
        }
      />

      {/* Mock Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
            <FileText size={22} />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-slate-800">0</h4>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Resumes</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <Award size={22} />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-slate-800">N/A</h4>
            <p className="text-xs text-slate-400 font-semibold uppercase">Average ATS Score</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <AlertCircle size={22} />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-slate-800">0</h4>
            <p className="text-xs text-slate-400 font-semibold uppercase">Suggested Edits</p>
          </div>
        </Card>
      </div>

      {/* Empty State */}
      <div className="mt-8">
        <EmptyState
          title="No Resumes Created Yet"
          description="Create your first resume with Bimba AI and kickstart your application process."
          actionLabel="Create Resume"
          onAction={() => navigate('/resume-builder')}
        />
      </div>
    </div>
  );
};
