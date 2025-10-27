
# 🚀 StaffSync Pro: All-in-One HR Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**StaffSync Pro** is a modern, comprehensive HR management solution designed to streamline workforce operations. Built with Next.js and Firebase, it provides a seamless experience for both HR managers and employees, covering everything from onboarding and task management to leave requests and payroll.

---

## ✨ Key Features

StaffSync Pro is packed with features to make HR management effortless and efficient.

-   👤 **Dual Dashboards**: Separate, tailored dashboards for HR Managers and Employees, providing relevant tools and information at a glance.
-   🔐 **Secure Two-Phase Authentication**:
    -   **HR Registration**: HR managers create a preliminary profile for new employees.
    -   **QR Code Onboarding**: New hires scan a unique QR code to set their password and complete their registration, ensuring a secure and simple onboarding process.
-   ✅ **Advanced Task Management**:
    -   HR can create, assign, and track general and CRM-related tasks.
    -   Employees receive real-time notifications (in-app and via email) for new tasks.
    -   Track task progress from "To Do" to "Completed".
-   🌴 **Automated Leave Management**:
    -   Employees can submit leave requests directly from their dashboard.
    -   HR receives notifications for new requests and can approve or reject them with a single click.
    -   Employees are automatically notified of the decision.
-   📈 **Live Employee & CRM Status**:
    -   **Employee Status**: Real-time view of employee check-in, check-out, and on-leave statuses.
    -   **Lead Management**: A built-in CRM to manage leads, assign follow-up tasks, and track lead status from "Cold" to "Converted".
-   💰 **Payroll & Employee Management**:
    -   View total monthly payroll at a glance.
    -   Easily update individual or bulk employee salaries.
    -   Securely manage employee profiles and data.

---

## 🛠️ Tech Stack

This project leverages a modern, robust technology stack for a high-performance, scalable application.

-   **Frontend**: [Next.js](https://nextjs.org/) (with App Router) & [React](https://react.dev/)
-   **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore, Authentication)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [ShadCN UI](https://ui.shadcn.com/) for components
-   **Type Safety**: [TypeScript](https://www.typescriptlang.org/)
-   **Email Notifications**: [Resend](https://resend.com/)

---

## ⚙️ Getting Started

Follow these steps to get a local copy of StaffSync Pro up and running.

### Prerequisites

-   Node.js (v18 or later)
-   npm or yarn

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/coderyash-ai/StaffSync-Pro.git
    cd StaffSync-Pro
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Firebase:**
    -   Create a new project on the [Firebase Console](https://console.firebase.google.com/).
    -   Enable **Firestore Database** and **Authentication** (with Email/Password provider).
    -   Copy your Firebase project configuration and replace the placeholder values in `src/lib/firebase.ts`.

4.  **Set up Environment Variables:**
    -   This project uses `Resend` for email notifications. Create a `.env` file in the root directory.
    -   Add your Resend API key to the `.env` file:
        ```
        RESEND_API_KEY=your_resend_api_key
        ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:9002`.

---

This project was built with assistance from **Firebase Studio**, an AI-driven development environment.
