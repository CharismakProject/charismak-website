import CourseManager from "@/components/courses/course-manager";

export const metadata = { title: "Manage courses & study guides", robots: { index: false, follow: false } };

export default function CourseManagePage() {
  return <div className="cx-skin"><CourseManager /></div>;
}
