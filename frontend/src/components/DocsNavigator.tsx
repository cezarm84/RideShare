import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDownIcon } from "../icons";

// Documentation structure based on docs/index.md
export interface DocItem {
  id: string;
  name: string;
  path: string;
}

export interface DocCategory {
  id: string;
  name: string;
  items: DocItem[];
}

// Documentation structure based on docs/index.md
const documentationStructure: DocCategory[] = [
  {
    id: "getting-started",
    name: "Getting Started",
    items: [
      { id: "index", name: "Introduction", path: "/docs/index" },
      { id: "api_consolidated", name: "API Documentation", path: "/docs/api_consolidated" },
      { id: "api_usage", name: "API Usage Guide", path: "/docs/api_usage" },
      { id: "api_auth_guide", name: "API Authentication", path: "/docs/api_auth_guide" },
      { id: "architecture", name: "Architecture", path: "/docs/architecture" },
      { id: "auth_flow", name: "Authentication Flow", path: "/docs/auth_flow" },
    ],
  },
  {
    id: "core-features",
    name: "Core Features",
    items: [
      { id: "ride_creation_examples", name: "Ride Creation Examples", path: "/docs/ride_creation_examples" },
      { id: "payment_methods", name: "Payment Methods", path: "/docs/payment_methods" },
      { id: "user_preferences", name: "User Preferences", path: "/docs/user_preferences" },
      { id: "geocoding_service", name: "Geocoding Service", path: "/docs/geocoding_service" },
      { id: "opencage_geocoding", name: "OpenCage Geocoding", path: "/docs/opencage_geocoding" },
    ],
  },
  {
    id: "administration",
    name: "Administration",
    items: [
      { id: "driver_management", name: "Driver Management", path: "/docs/driver_management" },
      { id: "vehicle_management", name: "Vehicle Management", path: "/docs/vehicle_management" },
      { id: "enterprise_operations", name: "Enterprise Operations", path: "/docs/enterprise_operations" },
    ],
  },
  {
    id: "development",
    name: "Development",
    items: [
      { id: "database_schema", name: "Database Schema", path: "/docs/database_schema" },
      { id: "database_migrations", name: "Database Migrations", path: "/docs/database_migrations" },
      { id: "database_migration_utilities", name: "Migration Utilities", path: "/docs/database_migration_utilities" },
      { id: "project_status", name: "Project Status", path: "/docs/project_status" },
      { id: "roadmap", name: "Roadmap", path: "/docs/roadmap" },
    ],
  },
  {
    id: "devops",
    name: "DevOps",
    items: [
      { id: "CI_CD_DOCS", name: "CI/CD Documentation", path: "/docs/CI_CD_DOCS" },
      { id: "deployment-strategy", name: "Deployment Strategy", path: "/docs/deployment-strategy" },
      { id: "production_deployment", name: "Production Deployment", path: "/docs/production_deployment" },
      { id: "pre-commit-setup", name: "Pre-commit Setup", path: "/docs/pre-commit-setup" },
    ],
  },
  {
    id: "testing",
    name: "Testing",
    items: [
      { id: "backend-testing-plan", name: "Backend Testing Plan", path: "/docs/backend-testing-plan" },
      { id: "frontend-testing-plan", name: "Frontend Testing Plan", path: "/docs/frontend-testing-plan" },
    ],
  },
  {
    id: "code-quality",
    name: "Code Quality",
    items: [
      { id: "backend-code-quality", name: "Backend Code Quality", path: "/docs/backend-code-quality" },
      { id: "frontend-code-quality", name: "Frontend Code Quality", path: "/docs/frontend-code-quality" },
      { id: "implementation-plan", name: "Implementation Plan", path: "/docs/implementation-plan" },
    ],
  },
];

interface DocsNavigatorProps {
  activeDocId?: string;
  onSelectDocument?: (docId: string) => void;
}

const DocsNavigator: React.FC<DocsNavigatorProps> = ({ activeDocId, onSelectDocument }) => {
  // Find which category contains the active document
  const findCategoryForDoc = (docId: string): string | null => {
    for (const category of documentationStructure) {
      if (category.items.some(item => item.id === docId)) {
        return category.id;
      }
    }
    return null;
  };

  // Initialize expanded sections based on active document
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Update expanded sections when active document changes
  useEffect(() => {
    if (activeDocId) {
      const categoryId = findCategoryForDoc(activeDocId);
      if (categoryId) {
        setExpandedSections(prev => ({
          ...prev,
          [categoryId]: true
        }));
      }
    }
  }, [activeDocId]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleDocumentClick = (docId: string) => {
    if (onSelectDocument) {
      onSelectDocument(docId);
    }
  };

  return (
    <div className="docs-navigator bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Documentation</h2>

      <div className="space-y-2">
        {documentationStructure.map((category) => (
          <div key={category.id} className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2 last:border-0">
            <button
              onClick={() => toggleSection(category.id)}
              className="flex items-center justify-between w-full text-left font-medium text-gray-700 dark:text-gray-300 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
            >
              <span>{category.name}</span>
              <ChevronDownIcon
                className={`w-5 h-5 transition-transform ${
                  expandedSections[category.id] ? "transform rotate-180" : ""
                }`}
              />
            </button>

            {expandedSections[category.id] && (
              <ul className="mt-2 ml-2 space-y-1">
                {category.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={item.path}
                      onClick={() => handleDocumentClick(item.id)}
                      className={`block py-1 px-2 rounded text-sm ${
                        activeDocId === item.id
                          ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 font-medium"
                          : "text-gray-600 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400"
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export { documentationStructure };
export default DocsNavigator;
