"use client"

import { useParams } from "next/navigation"

export default function TeacherExamViewPage() {

    const params = useParams()
    const examId = params.examId
    return (
        <div>
            <div>
                {examId}
            </div>
        </div>
    )
}