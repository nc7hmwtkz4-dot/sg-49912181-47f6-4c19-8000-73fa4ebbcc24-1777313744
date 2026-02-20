import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import Link from "next/link";
import { TrendingUp, Package, LayoutDashboard, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1], // Custom easing for smooth motion
    }
  }
};

const logoVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    }
  },
  float: {
    y: [-4, 4, -4],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    }
  }
};

export default function Home() {
  return (
    <Layout>
      <SEO 
        title="NumiVault - Professional Coin Collection Management"
        description="Manage your numismatic collection with precision. Track inventory, monitor bullion values, and analyze your investments."
      />

      <motion.div 
        className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-4">
          <motion.div 
            className="flex justify-center mb-6"
            variants={logoVariants}
            animate={["visible", "float"]}
          >
            <div className="w-24 h-24 relative">
              <Image
                src="/numivault-logo.png"
                alt="NumiVault Logo"
                width={96}
                height={96}
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl font-bold"
            variants={itemVariants}
          >
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              NumiVault
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Professional coin collection management with real-time bullion tracking
          </motion.p>
        </div>

        <motion.div 
          className="flex flex-wrap gap-4 justify-center"
          variants={itemVariants}
        >
          <Link href="/collection">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8">
                <Package className="w-5 h-5 mr-2" />
                View Collection
              </Button>
            </motion.div>
          </Link>
          
          <Link href="/dashboard">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button size="lg" variant="outline" className="border-border hover:bg-accent/10 hover:text-accent text-lg px-8">
                <LayoutDashboard className="w-5 h-5 mr-2" />
                Dashboard
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-16"
          variants={itemVariants}
        >
          {[
            {
              icon: TrendingUp,
              title: "Real-Time Pricing",
              description: "Live bullion values updated daily from Metal Price API"
            },
            {
              icon: Package,
              title: "SKU Management",
              description: "Organize by country code and KM# with detailed tracking"
            },
            {
              icon: DollarSign,
              title: "Profit Analytics",
              description: "Track sales, profits, and margins with detailed insights"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
            >
              <Card className="glass-card h-full">
                <CardContent className="pt-6 text-center space-y-2">
                  <motion.div 
                    className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3"
                    whileHover={{ 
                      scale: 1.1,
                      rotate: 5,
                      transition: { duration: 0.3 }
                    }}
                  >
                    <feature.icon className="w-6 h-6 text-primary" />
                  </motion.div>
                  <h3 className="font-semibold text-lg text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </Layout>
  );
}