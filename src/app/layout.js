
import "./globals.css"
import Provider from "@/components/Provider"
import { NotificationProvider } from "@/components/Notification"
import Header from "@/components/headers"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Provider>
          <NotificationProvider>
            <Header />
            <div className="pt-16">
              {children}
            </div>
          </NotificationProvider>
        </Provider>
      </body>
    </html>
  )
}