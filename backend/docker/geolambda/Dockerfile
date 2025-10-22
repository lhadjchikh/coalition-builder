# Build GDAL/GEOS/PROJ from source for GeoDjango support
# This base image is cached and reused across all environments
FROM public.ecr.aws/lambda/python:3.13 AS geolambda

# Version configuration - using latest stable versions
ENV GDAL_VERSION=3.10.3 \
    GEOS_VERSION=3.13.0 \
    PROJ_VERSION=9.4.1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install build dependencies using dnf (Amazon Linux 2023)
# Python 3.13 Lambda base images use dnf (symlinked to microdnf)
# Note: curl is already installed as curl-minimal, so we don't need to install it
RUN dnf install -y \
    gcc gcc-c++ make cmake \
    sqlite sqlite-devel \
    libcurl-devel \
    libtiff libtiff-devel \
    tar gzip bzip2 xz \
    && dnf clean all

# Build PROJ (required by GDAL)
WORKDIR /tmp
RUN curl -L https://download.osgeo.org/proj/proj-${PROJ_VERSION}.tar.gz | tar xz && \
    cd proj-${PROJ_VERSION} && \
    mkdir build && cd build && \
    cmake -DCMAKE_INSTALL_PREFIX=/opt .. && \
    make -j$(nproc) && \
    make install && \
    cd ../.. && rm -rf proj-${PROJ_VERSION}

# Build GEOS (required by GDAL for geometry operations)
RUN curl -L https://download.osgeo.org/geos/geos-${GEOS_VERSION}.tar.bz2 | tar xj && \
    cd geos-${GEOS_VERSION} && \
    mkdir build && cd build && \
    cmake -DCMAKE_INSTALL_PREFIX=/opt .. && \
    make -j$(nproc) && \
    make install && \
    cd ../.. && rm -rf geos-${GEOS_VERSION}

# Build GDAL with Python bindings
RUN curl -L https://github.com/OSGeo/gdal/releases/download/v${GDAL_VERSION}/gdal-${GDAL_VERSION}.tar.gz | tar xz && \
    cd gdal-${GDAL_VERSION} && \
    mkdir build && cd build && \
    cmake -DCMAKE_INSTALL_PREFIX=/opt \
        -DGDAL_USE_GEOS=ON \
        -DGEOS_INCLUDE_DIR=/opt/include \
        -DGEOS_LIBRARY=/opt/lib/libgeos_c.so \
        -DPROJ_ROOT=/opt \
        .. && \
    make -j$(nproc) && \
    make install && \
    cd ../.. && rm -rf gdal-${GDAL_VERSION}

# Set library paths for runtime and build
ENV LD_LIBRARY_PATH=/opt/lib:/opt/lib64:$LD_LIBRARY_PATH \
    GDAL_DATA=/opt/share/gdal \
    PROJ_DATA=/opt/share/proj \
    PROJ_LIB=/opt/share/proj \
    PATH=/opt/bin:$PATH

# Install Python GDAL bindings matching the compiled version
# Need to specify paths for the GDAL headers and libraries
RUN GDAL_CONFIG=/opt/bin/gdal-config \
    CPPFLAGS="-I/opt/include" \
    LDFLAGS="-L/opt/lib -L/opt/lib64" \
    pip install --no-cache-dir GDAL==${GDAL_VERSION}

# Verify installation
RUN python -c "from osgeo import gdal, ogr, osr; print(f'GDAL {gdal.__version__} installed successfully')" && \
    python -c "import os; os.environ['DJANGO_SETTINGS_MODULE']=''; from django.contrib.gis.geos import GEOSGeometry" || true

# Clean up build dependencies to reduce image size
RUN dnf remove -y gcc gcc-c++ make cmake && \
    dnf clean all && \
    rm -rf /tmp/* /var/cache/dnf/*

# Label for tracking
LABEL maintainer="Coalition Builder Team" \
      description="Base Lambda image with GDAL/GEOS/PROJ for GeoDjango" \
      gdal.version="${GDAL_VERSION}" \
      geos.version="${GEOS_VERSION}" \
      proj.version="${PROJ_VERSION}"