import React from 'react'
import { Head, Link, router, useForm } from '@inertiajs/react'
import {
  Calendar,
  Users,
  CheckCircle,
  UploadCloud,
  BarChart3,
  ArrowRight,
  FileText
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import AppLayout from '@/layouts/app-layout'
import InputError from '@/components/input-error'
import { BreadcrumbItem } from '@/types'

interface Appointment {
  id: number | string
  patient_name?: string
  appointment_date: string
  status: string
  service_type?: string
  appointment_type?: string
}

interface Stats {
  total: number
  upcoming: number
  completed: number
}

interface CompanyDashboardProps {
  appointments: Appointment[]
  stats: Stats
  user: any
  company: any
}

const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ appointments, stats, user, company }) => {
  const { data, setData, processing, errors } = useForm({
    file: null as File | null,
  })

  const [fileKey, setFileKey] = React.useState<number>(Date.now())

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setData('file', file)
  }

  const submitBulkUpload = (e: React.FormEvent) => {
    e.preventDefault()

    if (!data.file) {
      toast.error('Please select a CSV file!')
      return
    }

    router.post('/company/appointments/bulk', data, {
      forceFormData: true,
      onSuccess: () => {
        toast.success('Appointments uploaded successfully!')
        setData('file', null)
        setFileKey(Date.now())
      },
      onError: () => {
        toast.error('Failed to upload appointments!')
      },
    })
  }

  // DATA PROCESSING
  const statusCounts = appointments.reduce((acc, apt) => {
    acc[apt.status] = (acc[apt.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const typeCounts = appointments.reduce((acc, apt) => {
    const type = apt.service_type || apt.appointment_type || 'general'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalAppts =
    Object.values(statusCounts).reduce((a, b) => Number(a) + Number(b), 0) || 1

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  // ANIMATIONS
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  }

  const card = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <AppLayout>
      <motion.div
        className="space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
      <Head title="Company Dashboard" />

      {/* HEADER */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Company Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Manage your employee appointments and bulk uploads
        </p>
      </motion.div>

      {/* STATS */}
      <motion.div
        variants={container}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* TOTAL */}
        <motion.div variants={card} whileHover={{ scale: 1.04 }} className="bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        {/* UPCOMING */}
        <motion.div variants={card} whileHover={{ scale: 1.04 }} className="bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Upcoming</p>
              <p className="text-3xl font-bold">{stats.upcoming}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>

        {/* ✅ FIXED COMPLETED */}
        <motion.div variants={card} whileHover={{ scale: 1.04 }} className="bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Completed</p>
              <p className="text-3xl font-bold">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>
      </motion.div>

      {/* CHARTS */}
      <motion.div variants={container} className="grid lg:grid-cols-2 gap-6">
        {/* STATUS */}
        <motion.div variants={card} className="bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold mb-4">
            <BarChart3 className="w-5 h-5" /> Status
          </h3>

          {Object.entries(statusCounts).map(([status, count]) => {
            const pct = (count / totalAppts) * 100
            return (
              <div key={status} className="mb-3">
                <div className="flex justify-between text-sm">
                  <span>{status}</span>
                  <span>{count}</span>
                </div>
                <div className="bg-gray-200 h-2 rounded">
                  <motion.div
                    className="bg-blue-500 h-2 rounded"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </motion.div>

        {/* TYPE */}
        <motion.div variants={card} className="bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold mb-4">
            <BarChart3 className="w-5 h-5" /> Type
          </h3>

          {Object.entries(typeCounts).slice(0, 5).map(([type, count]) => {
            const total =
              Object.values(typeCounts).reduce((a, b) => Number(a) + Number(b), 0) || 1
            const pct = (count / total) * 100

            return (
              <div key={type} className="mb-3">
                <div className="flex justify-between text-sm">
                  <span>{type}</span>
                  <span>{count}</span>
                </div>
                <div className="bg-gray-200 h-2 rounded">
                  <motion.div
                    className="bg-purple-500 h-2 rounded"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </motion.div>
      </motion.div>

      {/* UPLOAD */}
      <motion.div variants={card} className="bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm">
        <form onSubmit={submitBulkUpload} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input
              id="csv-file"
              key={fileKey}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
            />
            <InputError message={errors.file} className="mt-2" />
          </div>
          <Button type="submit" disabled={processing}>
            {processing ? 'Uploading...' : 'Upload CSV'}
          </Button>
        </form>
      </motion.div>

      {/* RECENT */}
      <motion.div variants={card} className="bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm">
        <h3 className="mb-4 font-semibold">Recent Appointments</h3>

        {appointments.slice(0, 5).map((a) => (
          <div
            key={a.id}
            onClick={() => router.visit('/company/appointments')}
            className={`p-3 border rounded mb-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${getStatusBadge(a.status)}`}
          >
            <p className="font-medium">
              {a.patient_name || 'N/A'}
            </p>
            <p className="text-sm text-gray-500">
              {formatDate(a.appointment_date)} • {a.status}
            </p>
          </div>
        ))}
      </motion.div>

      {/* ACTIONS */}
      <div className="flex gap-4">
        <Link href="/company/appointments/create">
          <Button variant="outline">Create Appointment</Button>
        </Link>
        <Link href="/company/appointments">
          <Button>View All</Button>
        </Link>
      </div>
    </motion.div>
    </AppLayout>
  )
}

export default CompanyDashboard

