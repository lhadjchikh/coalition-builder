# Address Validation and Geocoding Documentation

Complete documentation for the address validation, geocoding, and legislative district assignment features in Coalition Builder.

## 📚 Documentation Index

### 🚀 Getting Started

- **[README Section](README-address-geocoding.md)** - Quick overview and setup instructions
- **[Feature Guide](address-validation.md)** - Comprehensive feature documentation with usage examples

### 🔌 API Documentation

- **[Enhanced Stakeholder API](../api/stakeholders-enhanced.md)** - Complete API reference for address and geocoding endpoints

### 👨‍💻 Developer Resources

- **[Architecture Guide](../development/geocoding-architecture.md)** - Technical implementation details and system design
- **[Quick Reference](../reference/geocoding-quick-reference.md)** - Code examples and common patterns

## 🎯 Choose Your Path

### **I'm New to This Feature**

Start with the **[README Section](README-address-geocoding.md)** for a quick overview, then read the **[Feature Guide](address-validation.md)** for comprehensive documentation.

### **I Need API Information**

Go directly to the **[Enhanced Stakeholder API](../api/stakeholders-enhanced.md)** documentation for endpoint details and examples.

### **I'm Implementing/Extending**

Read the **[Architecture Guide](../development/geocoding-architecture.md)** for system design details, then use the **[Quick Reference](../reference/geocoding-quick-reference.md)** for code examples.

### **I Need Quick Code Examples**

Jump to the **[Quick Reference](../reference/geocoding-quick-reference.md)** for copy-paste code snippets and common patterns.

## 🔧 Key Components

### Address Validation (`coalition/stakeholders/validators.py`)

- Validates US states, ZIP codes, street addresses, and cities
- Provides normalization and formatting functions
- Integrates with API schemas for automatic validation

### Geocoding Service (`coalition/stakeholders/services.py`)

- Multi-tier geocoding strategy (PostGIS Tiger + Nominatim fallback)
- Automatic legislative district assignment
- Error handling and retry logic

### Spatial Utilities (`coalition/stakeholders/spatial.py`)

- Geographic analysis and proximity queries
- District-based stakeholder grouping
- Statistical analysis functions

### Enhanced Models

- **Stakeholder**: Extended with address fields, location coordinates, and district relationships
- **Region**: Legislative district boundaries with abbreviations and spatial geometry

### Management Commands

- **`geocode_stakeholders`**: Batch geocoding for existing stakeholders
- **`import_tiger_data`**: Import US Census legislative district boundaries

## 📊 Features at a Glance

| Feature                  | Description                                  | Documentation                                                                    |
| ------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------- |
| **Address Validation**   | Validate and normalize US addresses          | [Feature Guide](address-validation.md#address-validator)                         |
| **Automatic Geocoding**  | Convert addresses to coordinates             | [Feature Guide](address-validation.md#geocoding-service)                         |
| **District Assignment**  | Assign stakeholders to legislative districts | [Feature Guide](address-validation.md#enhanced-stakeholder-model)                |
| **Spatial Queries**      | Find stakeholders by location/distance       | [API Docs](../api/stakeholders-enhanced.md#list-stakeholders)                    |
| **Geographic Filtering** | Filter by state, district, proximity         | [API Docs](../api/stakeholders-enhanced.md#query-parameters)                     |
| **Bulk Processing**      | Process large datasets efficiently           | [Quick Reference](../reference/geocoding-quick-reference.md#management-commands) |
| **Data Import**          | Import TIGER/Line legislative boundaries     | [Feature Guide](address-validation.md#management-commands)                       |

## 🛠️ Setup Quick Links

1. **[Database Configuration](address-validation.md#configuration)** - PostGIS/SpatiaLite setup
2. **[Dependency Installation](address-validation.md#dependencies)** - Required packages
3. **[API Integration](../api/stakeholders-enhanced.md#create-stakeholder)** - Using the enhanced endpoints
4. **[Data Import](../reference/geocoding-quick-reference.md#management-commands)** - Legislative district boundaries

## 🔍 Common Use Cases

- **[Creating Stakeholders with Addresses](../api/stakeholders-enhanced.md#create-stakeholder)**
- **[Finding Nearby Stakeholders](../reference/geocoding-quick-reference.md#spatial-queries)**
- **[Filtering by District](../api/stakeholders-enhanced.md#list-stakeholders)**
- **[Batch Geocoding](../reference/geocoding-quick-reference.md#management-commands)**
- **[Address Validation](../api/stakeholders-enhanced.md#manual-validation-endpoint)**
- **[Export with Geographic Data](../api/stakeholders-enhanced.md#csvjson-export)**

## ❓ Need Help?

- **Setup Issues**: Check the [Feature Guide](address-validation.md#troubleshooting) troubleshooting section
- **API Questions**: See the [API Documentation](../api/stakeholders-enhanced.md) examples
- **Implementation Details**: Review the [Architecture Guide](../development/geocoding-architecture.md)
- **Code Examples**: Browse the [Quick Reference](../reference/geocoding-quick-reference.md) patterns

## 📋 Checklist for Implementation

- [ ] Configure spatial database (PostGIS or SpatiaLite)
- [ ] Install required dependencies (`geopy`)
- [ ] Run database migrations
- [ ] Import legislative district data
- [ ] Test address validation with API
- [ ] Set up batch geocoding for existing data
- [ ] Configure monitoring and logging
- [ ] Review security considerations

---

This documentation covers a comprehensive address validation and geocoding system that enables Coalition Builder to automatically determine legislative districts for stakeholders and perform powerful geographic analysis.
